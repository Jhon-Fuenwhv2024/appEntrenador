<script setup>
/**
 * Programación section (Feature 061): week board + day builder + assign template.
 * Props: clientId. Emits: notify({ text, color }).
 */
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import {
  displayExerciseDescription,
  displayExerciseName,
} from '../../../shared/utils/exerciseDisplay.js';
import { createExercise, getAllExercises } from '../api/exercisesApi.js';
import {
  createClientRoutine,
  deleteRoutine,
  getClientRoutines,
  updateRoutine,
} from '../api/routinesApi.js';
import { assignTemplate, createTemplate } from '../api/templatesApi.js';
import ProgrammingAssignTemplateDialog from './ProgrammingAssignTemplateDialog.vue';
import ProgrammingWeekBoard from './ProgrammingWeekBoard.vue';
import RoutineDayBuilder from './RoutineDayBuilder.vue';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DEFAULT_TARGET_MUSCLE = 'Full Body';
const DEFAULT_REST_SECONDS = 90;

const props = defineProps({
  clientId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['notify']);

const routines = ref([]);
const catalogExercises = ref([]);
const loading = shallowRef(true);
const saving = shallowRef(false);
const savingCatalogIndex = shallowRef(null);
const savingTemplateId = shallowRef(null);
const duplicatingId = shallowRef(null);
const editingId = shallowRef(null);
const builderOpen = shallowRef(false);

const assignOpen = shallowRef(false);
const assignDefaultDay = shallowRef('Lunes');
const assignSaving = shallowRef(false);

const duplicateOpen = shallowRef(false);
const duplicateSource = shallowRef(null);
const duplicateDay = shallowRef('Lunes');

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

const form = reactive({
  dia_semana: 'Lunes',
  nombre_rutina: '',
  ejercicios: [emptyExerciseRow()],
});

const routinesCount = computed(() => routines.value.length);

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

const duplicateDayOptions = computed(() => {
  const sourceDay = duplicateSource.value?.dia_semana;
  return DAYS.filter((day) => day !== sourceDay);
});

const showNotification = (text, color = 'success') => {
  emit('notify', { text, color });
};

const toRestSeconds = (value) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) return DEFAULT_REST_SECONDS;
  if (n > 900) return 900;
  return n;
};

const resolveExerciseName = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value.name || value.title || value.value || '';
  }
  return String(value);
};

const resetForm = () => {
  editingId.value = null;
  form.dia_semana = 'Lunes';
  form.nombre_rutina = '';
  form.ejercicios = [emptyExerciseRow()];
};

const closeBuilder = () => {
  builderOpen.value = false;
  resetForm();
};

const openCreate = (day = 'Lunes') => {
  resetForm();
  form.dia_semana = DAYS.includes(day) ? day : 'Lunes';
  builderOpen.value = true;
};

const startEdit = (routine) => {
  editingId.value = routine.id;
  form.dia_semana = routine.dia_semana;
  form.nombre_rutina = routine.nombre_rutina;
  form.ejercicios = (routine.ejercicios || []).map((ex) => ({
    nombre: ex.nombre,
    exercise_id: ex.exercise_id ?? null,
    series: ex.series,
    repeticiones: ex.repeticiones,
    peso: Number(ex.peso) || 0,
    rest_time_seconds: toRestSeconds(ex.rest_time_seconds),
    superset_letter: toSupersetLetter(ex.superset_letter),
    indicaciones: ex.indicaciones || '',
  }));

  if (form.ejercicios.length === 0) {
    form.ejercicios.push(emptyExerciseRow());
  }
  builderOpen.value = true;
};

const addExerciseRow = () => {
  form.ejercicios.push(emptyExerciseRow());
};

const removeExerciseRow = (index) => {
  if (form.ejercicios.length <= 1) return;
  form.ejercicios.splice(index, 1);
};

const reorderExercise = ({ from, to }) => {
  if (from === to) return;
  if (from < 0 || to < 0) return;
  if (from >= form.ejercicios.length || to >= form.ejercicios.length) return;
  const [row] = form.ejercicios.splice(from, 1);
  form.ejercicios.splice(to, 0, row);
};

const onExerciseNameUpdate = ({ index, value }) => {
  const ex = form.ejercicios[index];
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

const setRestSeconds = ({ index, value }) => {
  const ex = form.ejercicios[index];
  if (!ex) return;
  ex.rest_time_seconds = toRestSeconds(value);
};

const loadCatalog = async () => {
  const items = await getAllExercises();
  catalogExercises.value = items.map((item) => ({
    ...item,
    display_name: displayExerciseName(item),
  }));
};

const loadData = async () => {
  try {
    loading.value = true;
    const routinesRes = await getClientRoutines(props.clientId);
    routines.value = routinesRes.data.data ?? [];
  } catch (error) {
    console.error('Error cargando rutinas del alumno:', error);
    showNotification(getApiErrorMessage(error, 'No se pudieron cargar las rutinas'), 'error');
  } finally {
    loading.value = false;
  }

  try {
    await loadCatalog();
  } catch (error) {
    console.error('Error cargando catálogo de ejercicios:', error);
    catalogExercises.value = [];
    showNotification(
      getApiErrorMessage(error, 'Catálogo no disponible; puedes escribir el nombre a mano'),
      'warning',
    );
  }
};

const saveExerciseToCatalog = async (index) => {
  const ex = form.ejercicios[index];
  const name = ex?.nombre?.trim();
  if (!name) return;
  const key = name.toLowerCase();
  if (catalogByName.value.has(key)) return;

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
      const match = catalogByName.value.get(key);
      ex.exercise_id = match?.id ?? null;
    }
    showNotification(`"${name}" guardado en el catálogo`);
  } catch (error) {
    console.error('Error guardando ejercicio en catálogo:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo guardar en el catálogo'), 'error');
  } finally {
    savingCatalogIndex.value = null;
  }
};

const buildPayload = () => ({
  dia_semana: form.dia_semana,
  nombre_rutina: form.nombre_rutina.trim(),
  ejercicios: form.ejercicios.map((ex) => ({
    nombre: ex.nombre.trim(),
    exercise_id: ex.exercise_id ?? null,
    series: Number(ex.series),
    repeticiones: Number(ex.repeticiones),
    peso: Number(ex.peso),
    rest_time_seconds: toRestSeconds(ex.rest_time_seconds),
    superset_letter: toSupersetLetter(ex.superset_letter),
    indicaciones: ex.indicaciones?.trim() || '',
  })),
});

const handleSave = async () => {
  try {
    saving.value = true;
    const payload = buildPayload();

    if (editingId.value) {
      await updateRoutine(editingId.value, payload);
      showNotification('Rutina actualizada');
    } else {
      await createClientRoutine(props.clientId, payload);
      showNotification('Rutina creada');
    }

    closeBuilder();
    await loadData();
  } catch (error) {
    console.error('Error guardando rutina:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo guardar la rutina'), 'error');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (routineId) => {
  if (!window.confirm('¿Eliminar esta rutina y sus ejercicios?')) return;

  try {
    await deleteRoutine(routineId);
    showNotification('Rutina eliminada');
    if (editingId.value === routineId) closeBuilder();
    await loadData();
  } catch (error) {
    console.error('Error eliminando rutina:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo eliminar'), 'error');
  }
};

const handleSaveAsTemplate = async (routine) => {
  if (!routine?.id) return;

  try {
    savingTemplateId.value = routine.id;
    await createTemplate({
      name: routine.nombre_rutina,
      notes: '',
      exercises: (routine.ejercicios || []).map((ex) => ({
        nombre: ex.nombre,
        exercise_id: ex.exercise_id ?? null,
        series: Number(ex.series),
        repeticiones: Number(ex.repeticiones),
        peso: Number(ex.peso),
        rest_time_seconds: toRestSeconds(ex.rest_time_seconds),
        superset_letter: toSupersetLetter(ex.superset_letter),
        indicaciones: ex.indicaciones || '',
      })),
    });
    showNotification(`"${routine.nombre_rutina}" guardada en Biblioteca`);
  } catch (error) {
    console.error('Error guardando plantilla:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo guardar como plantilla'), 'error');
  } finally {
    savingTemplateId.value = null;
  }
};

const openAssign = (day = 'Lunes') => {
  assignDefaultDay.value = DAYS.includes(day) ? day : 'Lunes';
  assignOpen.value = true;
};

const handleAssignSubmit = async ({ templateId, clientId, dia_semana }) => {
  try {
    assignSaving.value = true;
    await assignTemplate(templateId, { clientId, dia_semana });
    showNotification('Plantilla asignada');
    assignOpen.value = false;
    await loadData();
  } catch (error) {
    console.error('Error asignando plantilla:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo asignar la plantilla'), 'error');
  } finally {
    assignSaving.value = false;
  }
};

const openDuplicate = (routine) => {
  duplicateSource.value = routine;
  const otherDays = DAYS.filter((d) => d !== routine.dia_semana);
  duplicateDay.value = otherDays[0] || 'Lunes';
  duplicateOpen.value = true;
};

const handleDuplicateConfirm = async () => {
  const routine = duplicateSource.value;
  if (!routine?.id) return;

  try {
    duplicatingId.value = routine.id;
    await createClientRoutine(props.clientId, {
      dia_semana: duplicateDay.value,
      nombre_rutina: routine.nombre_rutina,
      ejercicios: (routine.ejercicios || []).map((ex) => ({
        nombre: ex.nombre,
        exercise_id: ex.exercise_id ?? null,
        series: Number(ex.series),
        repeticiones: Number(ex.repeticiones),
        peso: Number(ex.peso),
        rest_time_seconds: toRestSeconds(ex.rest_time_seconds),
        superset_letter: toSupersetLetter(ex.superset_letter),
        indicaciones: ex.indicaciones || '',
      })),
    });
    showNotification(`Copia en ${duplicateDay.value}`);
    duplicateOpen.value = false;
    duplicateSource.value = null;
    await loadData();
  } catch (error) {
    console.error('Error duplicando rutina:', error);
    showNotification(getApiErrorMessage(error, 'No se pudo duplicar la rutina'), 'error');
  } finally {
    duplicatingId.value = null;
  }
};

watch(() => props.clientId, () => {
  closeBuilder();
  loadData();
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="c360-programming">
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      class="mb-3"
      height="2"
    />

    <section class="ficha-panel programming-toolbar">
      <div class="ficha-panel__head programming-toolbar__head">
        <div class="min-w-0">
          <h2 class="ficha-panel__title">Programación</h2>
          <p class="ficha-panel__hint">
            Plan semanal del alumno
          </p>
        </div>
        <span class="ficha-panel__count">{{ routinesCount }}</span>
      </div>
      <div class="programming-toolbar__actions">
        <v-btn
          variant="outlined"
          size="small"
          class="tf-btn-muted"
          prepend-icon="mdi-bookshelf"
          @click="openAssign('Lunes')"
        >
          Desde biblioteca
        </v-btn>
        <v-btn
          color="primary"
          size="small"
          class="font-weight-bold"
          prepend-icon="mdi-plus"
          @click="openCreate('Lunes')"
        >
          Nueva rutina
        </v-btn>
      </div>
    </section>

    <ProgrammingWeekBoard
      :routines="routines"
      :saving-template-id="savingTemplateId"
      :duplicating-id="duplicatingId"
      @create="openCreate"
      @edit="startEdit"
      @assign="openAssign"
      @duplicate="openDuplicate"
      @delete="handleDelete"
      @save-template="handleSaveAsTemplate"
    />

    <p v-if="!loading && routines.length === 0 && !builderOpen" class="ficha-empty programming-empty">
      Sin rutinas aún. Asigna una plantilla o crea la primera sesión.
    </p>

    <RoutineDayBuilder
      v-if="builderOpen"
      :form="form"
      :editing-id="editingId"
      :catalog-exercises="catalogExercises"
      :saving="saving"
      :saving-catalog-index="savingCatalogIndex"
      @save="handleSave"
      @cancel="closeBuilder"
      @add-exercise="addExerciseRow"
      @remove-exercise="removeExerciseRow"
      @reorder-exercise="reorderExercise"
      @exercise-name-update="onExerciseNameUpdate"
      @save-to-catalog="saveExerciseToCatalog"
      @set-rest="setRestSeconds"
    />

    <ProgrammingAssignTemplateDialog
      v-model="assignOpen"
      :client-id="clientId"
      :default-day="assignDefaultDay"
      :saving="assignSaving"
      @submit="handleAssignSubmit"
    />

    <v-dialog
      v-model="duplicateOpen"
      max-width="400"
    >
      <v-card bg-color="surface">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Duplicar rutina</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Cerrar"
            @click="duplicateOpen = false"
          />
        </v-card-title>
        <v-card-text>
          <p class="text-medium-emphasis mb-4">
            Copia “{{ duplicateSource?.nombre_rutina }}” a otro día.
          </p>
          <v-select
            v-model="duplicateDay"
            :items="duplicateDayOptions"
            label="Día destino"
            density="compact"
            color="primary"
            bg-color="surface"
            :menu-props="{ contentClass: 'tf-overlay-menu', maxHeight: 280 }"
            :list-props="{ bgColor: 'surface', color: undefined }"
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="duplicateOpen = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="duplicatingId != null"
            :disabled="!duplicateDay"
            @click="handleDuplicateConfirm"
          >
            Duplicar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.c360-programming {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

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

.programming-toolbar__head {
  margin-bottom: 0.55rem;
}

.ficha-panel__title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.2;
}

.ficha-panel__count {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #c5cad3;
}

.ficha-panel__hint,
.ficha-empty {
  margin: 0.15rem 0 0;
  font-size: 0.72rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.programming-empty {
  margin: 0;
  text-align: center;
  padding: 0.25rem 0;
}

.programming-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  justify-content: flex-end;
}

.min-w-0 {
  min-width: 0;
}
</style>
