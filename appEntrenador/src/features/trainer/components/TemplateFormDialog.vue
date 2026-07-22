<script setup>
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import ExerciseMuscleFilter from '../../../shared/components/ExerciseMuscleFilter.vue';
import { exerciseMatchesMuscleFilter } from '../../../shared/constants/muscles.js';
import {
  displayExerciseDescription,
  displayExerciseMuscle,
  displayExerciseName,
} from '../../../shared/utils/exerciseDisplay.js';
import { createExercise, getAllExercises } from '../api/exercisesApi.js';

const DEFAULT_REST_SECONDS = 90;
const DEFAULT_TARGET_MUSCLE = 'Full Body';
/** Plain strings — avoid object items with null (Vuetify select often fails to bind). */
const SUPERSET_LETTER_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

const emptyExerciseRow = () => ({
  nombre: '',
  exercise_id: null,
  series: 3,
  repeticiones: 10,
  peso: 0,
  rest_time_seconds: DEFAULT_REST_SECONDS,
  superset_letter: null,
  indicaciones: '',
});

const toSupersetLetter = (value) => {
  if (value == null || value === '') return null;
  if (typeof value === 'object') {
    const nested = value.value ?? value.title ?? '';
    return toSupersetLetter(nested);
  }
  const letter = String(value).trim().toUpperCase();
  return /^[A-Z0-9]{1,2}$/.test(letter) ? letter : null;
};

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  template: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'submit']);

const router = useRouter();

const catalogExercises = ref([]);
const muscleFilter = shallowRef(null);
const onlyWarmup = shallowRef(false);
const catalogLoading = shallowRef(false);
const savingCatalogIndex = shallowRef(null);
const localSnack = reactive({
  show: false,
  text: '',
  color: 'success',
});

const form = reactive({
  name: '',
  notes: '',
  exercises: [emptyExerciseRow()],
});

const toRestSeconds = (value) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) return DEFAULT_REST_SECONDS;
  if (n > 900) return 900;
  return n;
};

const setRestSeconds = (index, value) => {
  const ex = form.exercises[index];
  if (!ex) return;
  ex.rest_time_seconds = toRestSeconds(value);
};

const catalogByName = computed(() => {
  const map = new Map();
  for (const item of catalogExercises.value) {
    const en = String(item.name || '').trim().toLowerCase();
    const es = String(item.name_es || '').trim().toLowerCase();
    if (en) map.set(en, item);
    if (es) map.set(es, item);
  }
  return map;
});

const filteredCatalogExercises = computed(() => (
  catalogExercises.value.filter((item) => (
    exerciseMatchesMuscleFilter(item, muscleFilter.value, onlyWarmup.value)
  ))
));

function catalogItemSubtitle(item) {
  const muscle = displayExerciseMuscle(item) || 'Sin etiquetar';
  return item?.is_warmup ? `${muscle} · Calentamiento` : muscle;
}

const notify = (text, color = 'success') => {
  localSnack.show = true;
  localSnack.text = text;
  localSnack.color = color;
};

const isNameInCatalog = (nombre) => {
  const key = (nombre || '').trim().toLowerCase();
  return key ? catalogByName.value.has(key) : false;
};

const resolveExerciseName = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value.name || value.title || value.value || '';
  }
  return String(value);
};

const onExerciseNameUpdate = (index, value) => {
  const ex = form.exercises[index];
  if (!ex) return;

  const name = resolveExerciseName(value);
  const match = catalogByName.value.get(name.trim().toLowerCase());
  ex.exercise_id = match?.id ?? null;
  ex.nombre = match ? displayExerciseName(match) : name;

  const hint = match ? displayExerciseDescription(match) : '';
  if (match && !ex.indicaciones?.trim() && hint) {
    ex.indicaciones = hint;
  }
};

const resetForm = () => {
  form.name = '';
  form.notes = '';
  form.exercises = [emptyExerciseRow()];
};

/** True when this row shares a letter with an adjacent exercise (visual group). */
const isSupersetGrouped = (index) => {
  const letter = form.exercises[index]?.superset_letter;
  if (!letter) return false;
  const prev = form.exercises[index - 1]?.superset_letter;
  const next = form.exercises[index + 1]?.superset_letter;
  return prev === letter || next === letter;
};

const fillFromTemplate = (template) => {
  if (!template) {
    resetForm();
    return;
  }

  form.name = template.name || '';
  form.notes = template.notes || '';
  const lines = Array.isArray(template.exercises) ? template.exercises : [];
  form.exercises = lines.length
    ? lines.map((ex) => ({
      nombre: ex.nombre || '',
      exercise_id: ex.exercise_id ?? null,
      series: Number(ex.series) || 3,
      repeticiones: Number(ex.repeticiones) || 10,
      peso: Number(ex.peso) || 0,
      rest_time_seconds: toRestSeconds(ex.rest_time_seconds),
      superset_letter: toSupersetLetter(ex.superset_letter),
      indicaciones: ex.indicaciones || '',
    }))
    : [emptyExerciseRow()];
};

const loadCatalog = async () => {
  try {
    catalogLoading.value = true;
    const items = await getAllExercises({ enriched: true });
    catalogExercises.value = items
      .filter((item) => Boolean(item.local_media_path?.trim()))
      .map((item) => ({
        ...item,
        display_name: displayExerciseName(item),
      }));
  } catch (error) {
    console.error('Error cargando catálogo:', error);
    catalogExercises.value = [];
    notify(
      getApiErrorMessage(error, 'Catálogo no disponible; puedes escribir el nombre a mano'),
      'warning',
    );
  } finally {
    catalogLoading.value = false;
  }
};

watch(
  () => [props.modelValue, props.template],
  ([open]) => {
    if (!open) return;
    fillFromTemplate(props.template);
    loadCatalog();
  },
);

const close = () => {
  emit('update:modelValue', false);
};

const addExercise = () => {
  form.exercises.push(emptyExerciseRow());
};

const removeExercise = (index) => {
  if (form.exercises.length <= 1) return;
  form.exercises.splice(index, 1);
};

const saveExerciseToCatalog = async (index) => {
  const ex = form.exercises[index];
  const name = resolveExerciseName(ex?.nombre).trim();
  if (!name || isNameInCatalog(name)) return;

  try {
    savingCatalogIndex.value = index;
    const res = await createExercise({
      name,
      target_muscle: DEFAULT_TARGET_MUSCLE,
      primary_muscle: DEFAULT_TARGET_MUSCLE,
      description: ex.indicaciones?.trim() || null,
      media_type: 'none',
    });
    await loadCatalog();
    const created = res.data?.data;
    if (created?.id) {
      ex.exercise_id = created.id;
    } else {
      const match = catalogByName.value.get(name.toLowerCase());
      ex.exercise_id = match?.id ?? null;
    }
    notify(`"${name}" guardado en el catálogo`);
  } catch (error) {
    console.error('Error guardando ejercicio en catálogo:', error);
    notify(getApiErrorMessage(error, 'No se pudo guardar en el catálogo'), 'error');
  } finally {
    savingCatalogIndex.value = null;
  }
};

const openCatalogPage = () => {
  close();
  router.push('/trainer/library/exercises');
};

const handleSubmit = () => {
  emit('submit', {
    name: form.name,
    notes: form.notes,
    exercises: form.exercises.map((ex) => ({
      nombre: resolveExerciseName(ex.nombre).trim(),
      exercise_id: ex.exercise_id ?? null,
      series: Number(ex.series),
      repeticiones: Number(ex.repeticiones),
      peso: Number(ex.peso),
      rest_time_seconds: toRestSeconds(ex.rest_time_seconds),
      superset_letter: toSupersetLetter(ex.superset_letter),
      indicaciones: ex.indicaciones,
    })),
  });
};
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="640"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card bg-color="surface" class="template-form-dialog">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ template?.id ? 'Editar plantilla' : 'Nueva plantilla' }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="Cerrar" @click="close" />
      </v-card-title>

      <v-card-text>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          class="mb-3 px-0"
          prepend-icon="mdi-dumbbell"
          @click="openCatalogPage"
        >
          Abrir catálogo completo
        </v-btn>

        <v-progress-linear
          v-if="catalogLoading"
          indeterminate
          color="primary"
          class="mb-3"
        />

        <v-text-field
          v-model="form.name"
          label="Nombre de la plantilla"
          density="compact"
          class="mb-3"
          color="primary"
        />

        <v-textarea
          v-model="form.notes"
          label="Notas (opcional)"
          density="compact"
          rows="2"
          auto-grow
          class="mb-3"
        />

        <div class="mb-3">
          <p class="text-caption text-medium-emphasis mb-1">
            Filtrar ejercicios
          </p>
          <ExerciseMuscleFilter
            v-model="muscleFilter"
            v-model:only-warmup="onlyWarmup"
            show-warmup
            label="Grupo muscular"
          />
        </div>

        <div
          v-for="(ex, index) in form.exercises"
          :key="index"
          class="exercise-block mb-4"
          :class="{ 'exercise-block--superset': isSupersetGrouped(index) }"
        >
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-caption text-medium-emphasis">Ejercicio {{ index + 1 }}</span>
            <v-btn
              v-if="form.exercises.length > 1"
              icon="mdi-close"
              size="x-small"
              variant="text"
              aria-label="Quitar ejercicio"
              @click="removeExercise(index)"
            />
          </div>

          <v-autocomplete
            :model-value="ex.nombre"
            :items="filteredCatalogExercises"
            item-title="display_name"
            item-value="name"
            label="Nombre (catálogo o texto libre)"
            density="compact"
            class="mb-2"
            clearable
            hide-no-data
            auto-select-first
            free-solo
            :menu-props="{ contentClass: 'tf-overlay-menu', maxHeight: 280 }"
            :list-props="{ bgColor: 'surface', color: undefined }"
            @update:model-value="(value) => onExerciseNameUpdate(index, value)"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item
                v-bind="itemProps"
                :subtitle="catalogItemSubtitle(item.raw || {})"
              />
            </template>
          </v-autocomplete>

          <v-btn
            v-if="resolveExerciseName(ex.nombre).trim() && !isNameInCatalog(ex.nombre)"
            size="small"
            variant="text"
            color="primary"
            class="mb-2 px-0"
            :loading="savingCatalogIndex === index"
            @click="saveExerciseToCatalog(index)"
          >
            Guardar en catálogo
          </v-btn>

          <v-row dense>
            <v-col cols="6" sm="3">
              <v-text-field
                v-model.number="ex.series"
                label="Series"
                type="number"
                min="1"
                density="compact"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field
                v-model.number="ex.repeticiones"
                label="Reps"
                type="number"
                min="1"
                density="compact"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field
                v-model.number="ex.peso"
                label="Peso"
                type="number"
                min="0"
                step="0.5"
                density="compact"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field
                :model-value="ex.rest_time_seconds"
                label="Descanso (s)"
                type="number"
                min="0"
                max="900"
                step="5"
                density="compact"
                hint="Entre series"
                persistent-hint
                @update:model-value="(value) => setRestSeconds(index, value)"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-select
                v-model="ex.superset_letter"
                :items="SUPERSET_LETTER_OPTIONS"
                label="Grupo"
                placeholder="—"
                density="compact"
                clearable
                :menu-props="{ contentClass: 'tf-overlay-menu' }"
                :list-props="{ bgColor: 'surface', color: undefined }"
              />
            </v-col>
          </v-row>
          <p v-if="index === 0" class="text-caption text-medium-emphasis mb-2">
            Misma letra en filas seguidas = superserie (ej. Press y Remo en A).
          </p>

          <v-text-field
            v-model="ex.indicaciones"
            label="Indicaciones"
            density="compact"
          />
        </div>

        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-plus"
          size="small"
          @click="addExercise"
        >
          Añadir ejercicio
        </v-btn>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="localSnack.show" :color="localSnack.color" :timeout="3000" location="top">
    {{ localSnack.text }}
  </v-snackbar>
</template>

<style scoped>
.exercise-block {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.exercise-block--superset {
  border-left: 3px solid rgb(var(--v-theme-primary));
  background: rgba(0, 229, 255, 0.06);
}
</style>
