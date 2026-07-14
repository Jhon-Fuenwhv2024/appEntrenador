<script setup>
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { createExercise, getExercises } from '../api/exercisesApi.js';

const DEFAULT_TARGET_MUSCLE = 'General';

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
  exercises: [
    { nombre: '', exercise_id: null, series: 3, repeticiones: 10, peso: 0, indicaciones: '' },
  ],
});

const catalogByName = computed(() => {
  const map = new Map();
  for (const item of catalogExercises.value) {
    map.set(String(item.name).toLowerCase(), item);
  }
  return map;
});

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
  ex.nombre = name;

  const match = catalogByName.value.get(name.trim().toLowerCase());
  ex.exercise_id = match?.id ?? null;

  if (match && !ex.indicaciones?.trim() && match.description) {
    ex.indicaciones = match.description;
  }
};

const resetForm = () => {
  form.name = '';
  form.notes = '';
  form.exercises = [
    { nombre: '', exercise_id: null, series: 3, repeticiones: 10, peso: 0, indicaciones: '' },
  ];
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
      indicaciones: ex.indicaciones || '',
    }))
    : [{ nombre: '', exercise_id: null, series: 3, repeticiones: 10, peso: 0, indicaciones: '' }];
};

const loadCatalog = async () => {
  try {
    catalogLoading.value = true;
    const res = await getExercises({ limit: 100 });
    catalogExercises.value = res.data.data ?? [];
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
  form.exercises.push({
    nombre: '',
    exercise_id: null,
    series: 3,
    repeticiones: 10,
    peso: 0,
    indicaciones: '',
  });
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
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
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
          class="mb-4"
        />

        <div
          v-for="(ex, index) in form.exercises"
          :key="index"
          class="exercise-block mb-4"
        >
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-caption text-medium-emphasis">Ejercicio {{ index + 1 }}</span>
            <v-btn
              v-if="form.exercises.length > 1"
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click="removeExercise(index)"
            />
          </div>

          <v-autocomplete
            :model-value="ex.nombre"
            :items="catalogExercises"
            item-title="name"
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
                :subtitle="item.raw?.target_muscle"
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
            <v-col cols="4">
              <v-text-field
                v-model.number="ex.series"
                label="Series"
                type="number"
                min="1"
                density="compact"
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model.number="ex.repeticiones"
                label="Reps"
                type="number"
                min="1"
                density="compact"
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model.number="ex.peso"
                label="Peso"
                type="number"
                min="0"
                step="0.5"
                density="compact"
              />
            </v-col>
          </v-row>

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
</style>
