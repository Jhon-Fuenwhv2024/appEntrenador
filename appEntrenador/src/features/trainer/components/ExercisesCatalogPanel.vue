<script setup>
import { ref, shallowRef } from 'vue';
import { displayExerciseName } from '../../../shared/utils/exerciseDisplay.js';
import { useExercisesCatalog } from '../composables/useExercisesCatalog.js';
import AssignCatalogExerciseDialog from './AssignCatalogExerciseDialog.vue';
import ExerciseCatalogForm from './ExerciseCatalogForm.vue';
import ExerciseCatalogList from './ExerciseCatalogList.vue';

const emit = defineEmits(['notify']);

const formRef = ref(null);
const editingExercise = shallowRef(null);
const assignOpen = shallowRef(false);
const assigningExercise = shallowRef(null);
/** Draft search before catalog is opened (progressive disclosure). */
const idleSearch = shallowRef('');

const {
  exercises,
  totalCount,
  currentPage,
  totalPages,
  canGoPrev,
  canGoNext,
  loading,
  saving,
  browsing,
  searchQuery,
  muscleFilter,
  onlyWarmup,
  errorMessage,
  globalCount,
  privateCount,
  pageSize,
  openCatalog,
  closeCatalog,
  goPrevPage,
  goNextPage,
  addExercise,
  saveExercise,
  removeExercise,
} = useExercisesCatalog();

const notify = (text, color = 'success') => {
  emit('notify', { text, color });
};

const handleCancelEdit = () => {
  editingExercise.value = null;
};

const handleEdit = (exercise) => {
  editingExercise.value = exercise;
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const handleAssign = (exercise) => {
  assigningExercise.value = exercise;
  assignOpen.value = true;
};

const handleAssignDone = ({ text, color }) => {
  notify(text, color || 'success');
};

const handleSubmit = async (payload) => {
  try {
    const label =
      payload instanceof FormData
        ? (payload.get('name') || 'Ejercicio')
        : (payload.name || 'Ejercicio');

    if (editingExercise.value?.id) {
      await saveExercise(editingExercise.value.id, payload);
      notify(`"${label}" actualizado`);
      editingExercise.value = null;
      formRef.value?.resetForm();
      return;
    }

    await addExercise(payload);
    formRef.value?.resetForm();
    notify(`"${label}" añadido a tu catálogo`);
  } catch {
    notify(errorMessage.value || 'No se pudo guardar el ejercicio', 'error');
  }
};

const handleDelete = async (exercise) => {
  const label = exercise.is_global ? 'global' : 'tuyo';
  const title = displayExerciseName(exercise);
  if (!window.confirm(`¿Eliminar "${title}" (${label}) del catálogo?`)) {
    return;
  }

  try {
    await removeExercise(exercise.id);
    if (editingExercise.value?.id === exercise.id) {
      editingExercise.value = null;
      formRef.value?.resetForm();
    }
    notify(`"${title}" eliminado`);
  } catch {
    notify(errorMessage.value || 'No se pudo eliminar el ejercicio', 'error');
  }
};

async function exploreCatalog() {
  idleSearch.value = '';
  try {
    await openCatalog({ q: '' });
  } catch {
    notify(errorMessage.value || 'No se pudo cargar el catálogo', 'error');
  }
}

async function searchFromIdle() {
  const q = idleSearch.value.trim();
  if (!q) {
    notify('Escribe un nombre para buscar en el catálogo', 'error');
    return;
  }
  try {
    await openCatalog({ q });
  } catch {
    notify(errorMessage.value || 'No se pudo buscar en el catálogo', 'error');
  }
}

async function hideCatalog() {
  closeCatalog();
  idleSearch.value = '';
  searchQuery.value = '';
  muscleFilter.value = null;
  onlyWarmup.value = false;
  editingExercise.value = null;
}
</script>

<template>
  <div class="catalog-panel">
    <v-row>
      <v-col cols="12" md="4">
        <div class="catalog-panel__card">
          <ExerciseCatalogForm
            ref="formRef"
            :saving="saving"
            :editing-exercise="editingExercise"
            @submit="handleSubmit"
            @cancel-edit="handleCancelEdit"
            @notify="(payload) => notify(payload.text, payload.color || 'error')"
          />
        </div>
      </v-col>

      <v-col cols="12" md="8">
        <div class="catalog-panel__card catalog-panel__card--browse">
          <!-- Idle: search-first empty state (no grid / no fetch). -->
          <div
            v-if="!browsing"
            class="catalog-idle"
            role="region"
            aria-labelledby="catalog-idle-title"
          >
            <header class="catalog-idle__header">
              <div class="catalog-idle__icon-wrap" aria-hidden="true">
                <v-icon
                  icon="mdi-dumbbell"
                  size="28"
                  color="primary"
                />
              </div>
              <div class="catalog-idle__heading">
                <h3
                  id="catalog-idle-title"
                  class="catalog-idle__title"
                >
                  Catálogo
                </h3>
                <p class="catalog-idle__text">
                  Busca por nombre o explora cuando lo necesites. Así no cargamos los ~750 ejercicios al entrar.
                </p>
              </div>
            </header>

            <form
              class="catalog-idle__search"
              role="search"
              aria-label="Buscar ejercicio en el catálogo"
              @submit.prevent="searchFromIdle"
            >
              <v-text-field
                v-model="idleSearch"
                placeholder="Buscar ejercicio…"
                label="Buscar"
                density="comfortable"
                variant="outlined"
                color="primary"
                hide-details="auto"
                clearable
                prepend-inner-icon="mdi-magnify"
                class="catalog-idle__search-field"
                :disabled="loading"
              />
              <v-btn
                type="submit"
                color="primary"
                class="catalog-idle__search-btn font-weight-bold"
                :loading="loading"
                :disabled="!idleSearch.trim()"
              >
                Buscar
              </v-btn>
            </form>

            <div class="catalog-idle__actions">
              <v-btn
                type="button"
                variant="outlined"
                color="primary"
                prepend-icon="mdi-view-grid-outline"
                class="catalog-idle__explore"
                :loading="loading"
                @click="exploreCatalog"
              >
                Explorar catálogo
              </v-btn>
            </div>
          </div>

          <!-- Active: filters + grid -->
          <template v-else>
            <div class="catalog-browse-toolbar">
              <v-btn
                type="button"
                variant="text"
                size="small"
                prepend-icon="mdi-chevron-left"
                class="catalog-browse-toolbar__hide"
                :disabled="loading"
                @click="hideCatalog"
              >
                Ocultar resultados
              </v-btn>
            </div>

            <ExerciseCatalogList
              v-model:search-query="searchQuery"
              v-model:muscle-filter="muscleFilter"
              v-model:only-warmup="onlyWarmup"
              :exercises="exercises"
              :loading="loading"
              :total-count="totalCount"
              :page-size="pageSize"
              :current-page="currentPage"
              :total-pages="totalPages"
              :can-go-prev="canGoPrev"
              :can-go-next="canGoNext"
              :global-count="globalCount"
              :private-count="privateCount"
              :editing-id="editingExercise?.id ?? null"
              @edit="handleEdit"
              @assign="handleAssign"
              @delete="handleDelete"
              @prev-page="goPrevPage"
              @next-page="goNextPage"
            />
          </template>
        </div>
      </v-col>
    </v-row>

    <AssignCatalogExerciseDialog
      v-model="assignOpen"
      :exercise="assigningExercise"
      @done="handleAssignDone"
    />
  </div>
</template>

<style scoped>
.catalog-panel__card {
  background:
    linear-gradient(165deg, rgba(0, 229, 255, 0.04), transparent 42%),
    rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.18);
}

.catalog-panel__card--browse {
  min-height: 100%;
}

.catalog-idle {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 0.15rem 0;
}

.catalog-idle__header {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  text-align: left;
}

.catalog-idle__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background: rgba(0, 229, 255, 0.12);
  border: 1px solid rgba(0, 229, 255, 0.28);
}

.catalog-idle__heading {
  min-width: 0;
}

.catalog-idle__title {
  margin: 0;
  font-size: var(--tf-text-xl, 1.375rem);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--tf-on-surface, #fff);
}

.catalog-idle__text {
  margin: 0.35rem 0 0;
  font-size: var(--tf-text-sm, 0.75rem);
  line-height: 1.5;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.catalog-idle__search {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.65rem;
}

.catalog-idle__search-field {
  flex: 1 1 14rem;
  margin: 0;
}

.catalog-idle__search-btn {
  flex: 0 0 auto;
  min-height: 2.75rem;
  min-width: 6.5rem;
}

.catalog-idle__search-btn :deep(.v-btn__content) {
  color: var(--tf-on-primary, #0b0d12);
}

.catalog-idle__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.catalog-idle__explore {
  min-height: 2.5rem;
  border-color: var(--tf-border, rgba(255, 255, 255, 0.28)) !important;
}

.catalog-browse-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.35rem;
}

.catalog-browse-toolbar__hide {
  color: var(--tf-on-surface-muted, #a8b0bc) !important;
}

.catalog-browse-toolbar__hide:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

@media (max-width: 600px) {
  .catalog-panel__card {
    padding: 1rem;
  }

  .catalog-idle__search-btn {
    width: 100%;
  }
}
</style>
