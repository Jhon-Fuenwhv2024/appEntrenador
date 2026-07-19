<script setup>
import { onMounted, reactive, ref, shallowRef } from 'vue';
import { displayExerciseName } from '../../../shared/utils/exerciseDisplay.js';
import ExerciseCatalogForm from './ExerciseCatalogForm.vue';
import ExerciseCatalogList from './ExerciseCatalogList.vue';
import { useExercisesCatalog } from '../composables/useExercisesCatalog.js';

const emit = defineEmits(['notify']);

const formRef = ref(null);
const editingExercise = shallowRef(null);

const {
  exercises,
  totalCount,
  currentPage,
  totalPages,
  canGoPrev,
  canGoNext,
  loading,
  saving,
  searchQuery,
  onlyEnriched,
  muscleFilter,
  onlyWarmup,
  errorMessage,
  globalCount,
  privateCount,
  pageSize,
  loadExercises,
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

const handleSubmit = async (payload) => {
  try {
    if (editingExercise.value?.id) {
      await saveExercise(editingExercise.value.id, payload);
      notify(`"${payload.name}" actualizado`);
      editingExercise.value = null;
      formRef.value?.resetForm();
      return;
    }

    await addExercise(payload);
    formRef.value?.resetForm();
    notify(`"${payload.name}" añadido a tu catálogo`);
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

onMounted(async () => {
  try {
    await loadExercises();
  } catch {
    notify(errorMessage.value || 'No se pudo cargar el catálogo', 'error');
  }
});
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
          />
        </div>
      </v-col>

      <v-col cols="12" md="8">
        <div class="catalog-panel__card">
          <ExerciseCatalogList
            v-model:search-query="searchQuery"
            v-model:only-enriched="onlyEnriched"
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
            @delete="handleDelete"
            @prev-page="goPrevPage"
            @next-page="goNextPage"
          />
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.catalog-panel__card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.5rem;
}

@media (max-width: 600px) {
  .catalog-panel__card {
    padding: 1rem;
  }
}
</style>
