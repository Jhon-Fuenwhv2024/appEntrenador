<script setup>
/**
 * Day routine builder with progressive disclosure (Feature 061).
 * Props: form model (reactive), catalog, editing state. Emits save/cancel/catalog actions.
 */
import { computed, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import ExerciseMuscleFilter from '../../../shared/components/ExerciseMuscleFilter.vue';
import { exerciseMatchesMuscleFilter } from '../../../shared/constants/muscles.js';
import {
  displayExerciseMuscle,
} from '../../../shared/utils/exerciseDisplay.js';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const SUPERSET_LETTER_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  editingId: {
    type: [Number, null],
    default: null,
  },
  catalogExercises: {
    type: Array,
    default: () => [],
  },
  saving: {
    type: Boolean,
    default: false,
  },
  savingCatalogIndex: {
    type: [Number, null],
    default: null,
  },
});

const emit = defineEmits([
  'save',
  'cancel',
  'add-exercise',
  'remove-exercise',
  'reorder-exercise',
  'exercise-name-update',
  'save-to-catalog',
  'set-rest',
]);

const router = useRouter();
const muscleFilter = shallowRef(null);
const onlyWarmup = shallowRef(false);
/** Per-row expand for grupo + indicaciones */
const expandedExtras = shallowRef(new Set());

const catalogByName = computed(() => {
  const map = new Map();
  for (const item of props.catalogExercises) {
    const en = String(item.name || '').trim().toLowerCase();
    const es = String(item.name_es || '').trim().toLowerCase();
    if (en) map.set(en, item);
    if (es) map.set(es, item);
  }
  return map;
});

const filteredCatalogExercises = computed(() => (
  props.catalogExercises.filter((item) => (
    exerciseMatchesMuscleFilter(item, muscleFilter.value, onlyWarmup.value)
  ))
));

function catalogItemSubtitle(item) {
  const muscle = displayExerciseMuscle(item) || 'Sin etiquetar';
  return item?.is_warmup ? `${muscle} · Calentamiento` : muscle;
}

const isNameInCatalog = (nombre) => {
  const key = (nombre || '').trim().toLowerCase();
  return key ? catalogByName.value.has(key) : false;
};

const isSupersetGrouped = (index) => {
  const letter = props.form.ejercicios[index]?.superset_letter;
  if (!letter) return false;
  const prev = props.form.ejercicios[index - 1]?.superset_letter;
  const next = props.form.ejercicios[index + 1]?.superset_letter;
  return prev === letter || next === letter;
};

const isExtrasOpen = (index) => expandedExtras.value.has(index);

const toggleExtras = (index) => {
  const next = new Set(expandedExtras.value);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  expandedExtras.value = next;
};

const hasExtrasHint = (ex) => Boolean(ex.superset_letter || ex.indicaciones?.trim());

const moveExercise = (index, delta) => {
  const target = index + delta;
  if (target < 0 || target >= props.form.ejercicios.length) return;
  emit('reorder-exercise', { from: index, to: target });
};
</script>

<template>
  <section class="ficha-panel routine-editor">
    <div class="ficha-panel__head routine-editor__head">
      <h2 class="ficha-panel__title">
        {{ editingId ? 'Editar rutina' : 'Nueva rutina' }}
      </h2>
      <v-btn
        variant="text"
        color="primary"
        size="x-small"
        class="px-1"
        prepend-icon="mdi-dumbbell"
        @click="router.push('/trainer/library/exercises')"
      >
        Catálogo
      </v-btn>
    </div>

    <div class="routine-meta-row">
      <label class="field-block field-block--day">
        <span class="field-cap">Día</span>
        <v-select
          v-model="form.dia_semana"
          :items="DAYS"
          density="compact"
          variant="outlined"
          hide-details
          color="primary"
          :menu-props="{ contentClass: 'tf-overlay-menu', maxHeight: 280 }"
          :list-props="{ bgColor: 'surface', color: undefined }"
        />
      </label>
      <label class="field-block field-block--name">
        <span class="field-cap">Nombre</span>
        <v-text-field
          v-model="form.nombre_rutina"
          placeholder="Ej. Empuje, Piernas…"
          density="compact"
          variant="outlined"
          hide-details
          color="primary"
        />
      </label>
    </div>

    <div class="routine-filter-row">
      <span class="field-cap">Filtrar ejercicios</span>
      <ExerciseMuscleFilter
        v-model="muscleFilter"
        v-model:only-warmup="onlyWarmup"
        show-warmup
        label="Grupo muscular"
      />
    </div>

    <div
      v-for="(ex, index) in form.ejercicios"
      :key="index"
      class="exercise-form-block"
      :class="{ 'exercise-form-block--superset': isSupersetGrouped(index) }"
    >
      <div class="exercise-form-block__head">
        <span class="exercise-form-label">Ejercicio {{ index + 1 }}</span>
        <div class="exercise-form-block__head-actions">
          <v-btn
            icon="mdi-arrow-up"
            size="x-small"
            variant="text"
            :disabled="index === 0"
            aria-label="Subir ejercicio"
            @click="moveExercise(index, -1)"
          />
          <v-btn
            icon="mdi-arrow-down"
            size="x-small"
            variant="text"
            :disabled="index >= form.ejercicios.length - 1"
            aria-label="Bajar ejercicio"
            @click="moveExercise(index, 1)"
          />
          <v-btn
            v-if="form.ejercicios.length > 1"
            icon="mdi-close"
            size="x-small"
            variant="text"
            aria-label="Quitar ejercicio"
            @click="emit('remove-exercise', index)"
          />
        </div>
      </div>

      <label class="field-block">
        <span class="field-cap">Ejercicio</span>
        <v-autocomplete
          :model-value="ex.nombre"
          :items="filteredCatalogExercises"
          item-title="display_name"
          item-value="name"
          placeholder="Catálogo o texto libre"
          density="compact"
          variant="outlined"
          hide-details="auto"
          clearable
          hide-no-data
          auto-select-first
          free-solo
          color="primary"
          :menu-props="{ contentClass: 'tf-overlay-menu', maxHeight: 280 }"
          :list-props="{ bgColor: 'surface', color: undefined }"
          @update:model-value="(value) => emit('exercise-name-update', { index, value })"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item
              v-bind="itemProps"
              :subtitle="catalogItemSubtitle(item.raw || {})"
            />
          </template>
        </v-autocomplete>
      </label>

      <v-btn
        v-if="ex.nombre?.trim() && !isNameInCatalog(ex.nombre)"
        size="x-small"
        variant="text"
        color="primary"
        class="exercise-form-block__catalog-btn"
        :loading="savingCatalogIndex === index"
        @click="emit('save-to-catalog', index)"
      >
        Guardar en catálogo
      </v-btn>

      <div class="exercise-metrics" role="group" aria-label="Carga">
        <label class="metric">
          <span class="field-cap">Series</span>
          <v-text-field
            v-model.number="ex.series"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
            min="1"
            color="primary"
          />
        </label>
        <label class="metric">
          <span class="field-cap">Reps</span>
          <v-text-field
            v-model.number="ex.repeticiones"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
            min="1"
            color="primary"
          />
        </label>
        <label class="metric metric--peso">
          <span class="field-cap">Kg</span>
          <v-text-field
            v-model.number="ex.peso"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
            min="0"
            step="0.5"
            color="primary"
          />
        </label>
        <label class="metric metric--rest">
          <span class="field-cap">Descanso (s)</span>
          <v-text-field
            :model-value="ex.rest_time_seconds"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
            min="0"
            max="900"
            step="5"
            color="primary"
            aria-label="Descanso entre series en segundos"
            @update:model-value="(value) => emit('set-rest', { index, value })"
          />
        </label>
      </div>

      <button
        type="button"
        class="extras-toggle"
        :aria-expanded="isExtrasOpen(index)"
        @click="toggleExtras(index)"
      >
        <v-icon
          :icon="isExtrasOpen(index) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="16"
        />
        Grupo / indicaciones
        <span v-if="hasExtrasHint(ex) && !isExtrasOpen(index)" class="extras-toggle__dot" />
      </button>

      <div v-if="isExtrasOpen(index)" class="exercise-extras">
        <label class="metric metric--group">
          <span class="field-cap">Grupo</span>
          <v-select
            v-model="ex.superset_letter"
            :items="SUPERSET_LETTER_OPTIONS"
            placeholder="—"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            color="primary"
            :menu-props="{ contentClass: 'tf-overlay-menu' }"
            :list-props="{ bgColor: 'surface', color: undefined }"
            aria-label="Grupo superserie — misma letra en ejercicios consecutivos"
          />
        </label>
        <p v-if="index === 0" class="superset-hint">
          Misma letra en filas seguidas = superserie (ej. Press y Remo en A).
        </p>
        <label class="field-block">
          <span class="field-cap">Indicaciones <em>(opcional)</em></span>
          <v-textarea
            v-model="ex.indicaciones"
            placeholder="Notas técnicas breves"
            density="compact"
            variant="outlined"
            rows="1"
            auto-grow
            hide-details
            color="primary"
            class="exercise-notes"
          />
        </label>
      </div>
    </div>

    <div class="ficha-form-actions">
      <v-btn
        variant="outlined"
        size="small"
        class="tf-btn-muted"
        @click="emit('add-exercise')"
      >
        + Ejercicio
      </v-btn>
      <div class="ficha-form-actions__primary">
        <v-btn
          variant="text"
          size="small"
          @click="emit('cancel')"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          class="font-weight-bold"
          size="small"
          :loading="saving"
          @click="emit('save')"
        >
          {{ editingId ? 'Guardar' : 'Crear rutina' }}
        </v-btn>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ficha-panel {
  padding: 0.8rem 0.85rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.ficha-panel__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  margin-bottom: 0.6rem;
}

.routine-editor__head {
  margin-bottom: 0.4rem;
}

.ficha-panel__title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.2;
}

.routine-filter-row {
  margin: 0.15rem 0 0.45rem;
}

.routine-filter-row > .field-cap {
  margin-bottom: 0.25rem;
}

.exercise-form-block {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.5rem 0.55rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 0.45rem;
}

.exercise-form-block--superset {
  border-left: 3px solid rgb(var(--v-theme-primary));
  background: rgba(0, 229, 255, 0.06);
}

.exercise-form-block__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 22px;
}

.exercise-form-block__head-actions {
  display: flex;
  align-items: center;
}

.exercise-form-label {
  font-size: 0.68rem;
  color: #00e5ff;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.exercise-form-block__catalog-btn {
  align-self: flex-start;
  min-height: 22px !important;
  padding-inline: 0 !important;
}

.field-cap {
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--tf-on-surface-muted, #a8b0bc);
  margin-bottom: 0.2rem;
  line-height: 1.2;
}

.field-cap em {
  font-style: normal;
  font-weight: 500;
  opacity: 0.75;
}

.field-block {
  display: block;
  width: 100%;
  min-width: 0;
}

.routine-meta-row {
  display: grid;
  grid-template-columns: 8.5rem minmax(0, 1fr);
  gap: 0.45rem;
  margin-bottom: 0.5rem;
  align-items: end;
}

@media (max-width: 520px) {
  .routine-meta-row {
    grid-template-columns: 1fr;
  }
}

.exercise-metrics {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.4rem;
}

.metric {
  display: block;
  width: 4.5rem;
  flex: 0 0 4.5rem;
}

.metric--peso {
  width: 5rem;
  flex-basis: 5rem;
}

.metric--rest {
  width: 6.25rem;
  flex-basis: 6.25rem;
}

.metric--group {
  width: 5.5rem;
  flex-basis: 5.5rem;
  margin-bottom: 0.35rem;
}

.extras-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0;
  border: 0;
  background: transparent;
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
}

.extras-toggle:hover {
  color: rgb(var(--v-theme-primary));
}

.extras-toggle__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
}

.exercise-extras {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-top: 0.15rem;
}

.superset-hint {
  margin: 0;
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.35;
}

.exercise-notes {
  margin-top: 0;
}

.routine-editor :deep(.v-field) {
  border-radius: 8px;
  font-size: 0.85rem;
}

.routine-editor :deep(.v-input) {
  margin-bottom: 0;
}

.routine-editor :deep(.metric .v-field__input) {
  text-align: center;
  font-variant-numeric: tabular-nums;
  padding-inline: 0.35rem !important;
  min-width: 0;
}

.routine-editor :deep(.metric input) {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.ficha-form-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.55rem;
}

.ficha-form-actions__primary {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
}
</style>
