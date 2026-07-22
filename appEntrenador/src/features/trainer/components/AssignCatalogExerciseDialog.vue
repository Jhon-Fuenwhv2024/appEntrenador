<script setup>
/**
 * Add a catalog exercise to a library template or a client's routine.
 */
import { computed, ref, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import {
  displayExerciseDescription,
  displayExerciseMuscle,
  displayExerciseName,
} from '../../../shared/utils/exerciseDisplay.js';
import { getClients } from '../api/clientsApi.js';
import { getClientRoutines, updateRoutine } from '../api/routinesApi.js';
import { getTemplates, updateTemplate } from '../api/templatesApi.js';

const DEFAULT_REST = 90;
const MENU_PROPS = { contentClass: 'tf-overlay-menu', maxHeight: 280 };
const LIST_PROPS = { bgColor: 'surface', color: undefined };

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  exercise: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'done']);

const targetKind = shallowRef('template'); // 'template' | 'routine'
const templates = ref([]);
const clients = ref([]);
const clientRoutines = ref([]);

const templateId = shallowRef(null);
const clientId = shallowRef(null);
const routineId = shallowRef(null);

const series = shallowRef(3);
const reps = shallowRef(10);
const restSeconds = shallowRef(DEFAULT_REST);

const loading = shallowRef(false);
const loadingRoutines = shallowRef(false);
const saving = shallowRef(false);
const loadError = shallowRef('');

const exerciseTitle = computed(() => (
  props.exercise ? displayExerciseName(props.exercise) : 'Ejercicio'
));

const exerciseMuscle = computed(() => (
  props.exercise ? (displayExerciseMuscle(props.exercise) || 'Sin etiquetar') : ''
));

const canSubmit = computed(() => {
  if (!props.exercise?.id) return false;
  if (targetKind.value === 'template') return Boolean(templateId.value);
  return Boolean(routineId.value);
});

const routineItems = computed(() => (
  clientRoutines.value.map((r) => ({
    title: `${r.dia_semana} · ${r.nombre_rutina}`,
    value: r.id,
  }))
));

function buildLine() {
  const item = props.exercise;
  return {
    nombre: displayExerciseName(item),
    exercise_id: item.id ?? null,
    series: Math.max(1, Math.round(Number(series.value)) || 3),
    repeticiones: Math.max(1, Math.round(Number(reps.value)) || 10),
    peso: 0,
    rest_time_seconds: Math.min(900, Math.max(0, Math.round(Number(restSeconds.value)) || DEFAULT_REST)),
    superset_letter: null,
    indicaciones: displayExerciseDescription(item) || '',
  };
}

function mapTemplateExercises(list) {
  return (list || []).map((ex) => ({
    nombre: ex.nombre,
    exercise_id: ex.exercise_id ?? null,
    series: Number(ex.series),
    repeticiones: Number(ex.repeticiones),
    peso: Number(ex.peso) || 0,
    rest_time_seconds: Number(ex.rest_time_seconds) || DEFAULT_REST,
    superset_letter: ex.superset_letter ?? null,
    indicaciones: ex.indicaciones || '',
  }));
}

function mapRoutineExercises(list) {
  return mapTemplateExercises(list);
}

async function loadOptions() {
  try {
    loading.value = true;
    loadError.value = '';
    const [tplRes, clientsRes] = await Promise.all([
      getTemplates(),
      getClients(),
    ]);
    templates.value = tplRes.data?.success ? (tplRes.data.data ?? []) : [];
    clients.value = clientsRes.data?.success
      ? (clientsRes.data.clients ?? [])
      : [];
    if (!tplRes.data?.success && !clientsRes.data?.success) {
      loadError.value = 'No se pudieron cargar plantillas ni alumnos';
    }
  } catch (error) {
    loadError.value = getApiErrorMessage(error, 'Error al cargar opciones');
    templates.value = [];
    clients.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadClientRoutines(id) {
  clientRoutines.value = [];
  routineId.value = null;
  if (!id) return;

  try {
    loadingRoutines.value = true;
    const res = await getClientRoutines(id);
    clientRoutines.value = res.data?.data ?? [];
  } catch (error) {
    console.error('Error cargando rutinas del alumno:', error);
    clientRoutines.value = [];
    loadError.value = getApiErrorMessage(error, 'No se pudieron cargar las rutinas');
  } finally {
    loadingRoutines.value = false;
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    targetKind.value = 'template';
    templateId.value = null;
    clientId.value = null;
    routineId.value = null;
    clientRoutines.value = [];
    series.value = 3;
    reps.value = 10;
    restSeconds.value = DEFAULT_REST;
    loadOptions();
  },
);

watch(clientId, (id) => {
  loadClientRoutines(id);
});

const setTarget = (kind) => {
  targetKind.value = kind;
};

const close = () => {
  emit('update:modelValue', false);
};

const handleSubmit = async () => {
  if (!canSubmit.value || !props.exercise) return;

  try {
    saving.value = true;
    const line = buildLine();

    if (targetKind.value === 'template') {
      const template = templates.value.find((t) => t.id === templateId.value);
      if (!template) throw new Error('Plantilla no encontrada');

      await updateTemplate(template.id, {
        name: template.name,
        notes: template.notes || '',
        exercises: [...mapTemplateExercises(template.exercises), line],
      });

      emit('done', {
        text: `"${exerciseTitle.value}" añadido a la plantilla «${template.name}»`,
      });
    } else {
      const routine = clientRoutines.value.find((r) => r.id === routineId.value);
      if (!routine) throw new Error('Rutina no encontrada');

      await updateRoutine(routine.id, {
        dia_semana: routine.dia_semana,
        nombre_rutina: routine.nombre_rutina,
        ejercicios: [...mapRoutineExercises(routine.ejercicios), line],
      });

      emit('done', {
        text: `"${exerciseTitle.value}" añadido a «${routine.nombre_rutina}» (${routine.dia_semana})`,
      });
    }

    close();
  } catch (error) {
    console.error('Error añadiendo ejercicio:', error);
    emit('done', {
      text: getApiErrorMessage(error, 'No se pudo añadir el ejercicio'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    scrim="rgba(0, 0, 0, 0.72)"
    transition="dialog-bottom-transition"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="tf-assign-dialog">
      <header class="tf-assign-dialog__head">
        <div class="min-w-0">
          <p class="tf-assign-dialog__eyebrow">Catálogo</p>
          <h2 class="tf-assign-dialog__title">Añadir ejercicio</h2>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          class="tf-assign-dialog__close"
          aria-label="Cerrar"
          @click="close"
        />
      </header>

      <div class="tf-assign-dialog__body">
        <div class="tf-assign-exercise" aria-label="Ejercicio seleccionado">
          <span class="tf-assign-exercise__icon" aria-hidden="true">
            <v-icon icon="mdi-dumbbell" size="20" />
          </span>
          <div class="min-w-0">
            <p class="tf-assign-exercise__name">{{ exerciseTitle }}</p>
            <p v-if="exerciseMuscle" class="tf-assign-exercise__meta">
              {{ exerciseMuscle }}
            </p>
          </div>
        </div>

        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-3"
          height="2"
        />

        <v-alert
          v-else-if="loadError"
          type="error"
          variant="tonal"
          density="comfortable"
          class="mb-3"
        >
          {{ loadError }}
        </v-alert>

        <div class="tf-assign-section">
          <span class="field-cap">Destino</span>
          <div
            class="tf-segment"
            role="tablist"
            aria-label="Tipo de destino"
          >
            <button
              type="button"
              role="tab"
              class="tf-segment__btn"
              :class="{ 'tf-segment__btn--active': targetKind === 'template' }"
              :aria-selected="targetKind === 'template'"
              @click="setTarget('template')"
            >
              <v-icon icon="mdi-bookshelf" size="16" />
              Plantilla
            </button>
            <button
              type="button"
              role="tab"
              class="tf-segment__btn"
              :class="{ 'tf-segment__btn--active': targetKind === 'routine' }"
              :aria-selected="targetKind === 'routine'"
              @click="setTarget('routine')"
            >
              <v-icon icon="mdi-account-multiple" size="16" />
              Rutina
            </button>
          </div>
        </div>

        <div v-if="targetKind === 'template'" class="tf-assign-section">
          <label class="field-block">
            <span class="field-cap">Plantilla</span>
            <v-select
              v-model="templateId"
              :items="templates"
              item-title="name"
              item-value="id"
              placeholder="Elige una plantilla"
              density="compact"
              variant="outlined"
              hide-details
              color="primary"
              :disabled="loading || templates.length === 0"
              :menu-props="MENU_PROPS"
              :list-props="LIST_PROPS"
            />
          </label>
          <p
            v-if="!loading && templates.length === 0"
            class="tf-assign-hint"
          >
            No hay plantillas. Crea una en Biblioteca primero.
          </p>
        </div>

        <div v-else class="tf-assign-section tf-assign-section--stack">
          <label class="field-block">
            <span class="field-cap">Alumno</span>
            <v-select
              v-model="clientId"
              :items="clients"
              item-title="nombre"
              item-value="id"
              placeholder="Elige un alumno"
              density="compact"
              variant="outlined"
              hide-details
              color="primary"
              :disabled="loading || clients.length === 0"
              :menu-props="MENU_PROPS"
              :list-props="LIST_PROPS"
            />
          </label>
          <label class="field-block">
            <span class="field-cap">Rutina</span>
            <v-select
              v-model="routineId"
              :items="routineItems"
              placeholder="Elige una rutina"
              density="compact"
              variant="outlined"
              hide-details
              color="primary"
              :loading="loadingRoutines"
              :disabled="!clientId || loadingRoutines || routineItems.length === 0"
              :menu-props="MENU_PROPS"
              :list-props="LIST_PROPS"
            />
          </label>
          <p
            v-if="clientId && !loadingRoutines && routineItems.length === 0"
            class="tf-assign-hint"
          >
            Este alumno no tiene rutinas. Créalas en Programación.
          </p>
        </div>

        <div class="tf-assign-section">
          <span class="field-cap">Carga inicial</span>
          <div class="tf-assign-metrics" role="group" aria-label="Series, reps y descanso">
            <label class="metric">
              <span class="field-cap">Series</span>
              <v-text-field
                v-model.number="series"
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
                v-model.number="reps"
                type="number"
                density="compact"
                variant="outlined"
                hide-details
                min="1"
                color="primary"
              />
            </label>
            <label class="metric metric--rest">
              <span class="field-cap">Descanso (s)</span>
              <v-text-field
                v-model.number="restSeconds"
                type="number"
                density="compact"
                variant="outlined"
                hide-details
                min="0"
                max="900"
                step="5"
                color="primary"
              />
            </label>
          </div>
        </div>
      </div>

      <footer class="tf-assign-dialog__foot">
        <v-btn
          variant="outlined"
          class="tf-btn-muted"
          :disabled="saving"
          @click="close"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          class="font-weight-bold"
          :loading="saving"
          :disabled="!canSubmit || loading"
          @click="handleSubmit"
        >
          Añadir
        </v-btn>
      </footer>
    </div>
  </v-dialog>
</template>

<style scoped>
.tf-assign-dialog {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background: var(--tf-surface, #1e1e1e);
  border: 1px solid var(--tf-border, rgba(255, 255, 255, 0.08));
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
}

.tf-assign-dialog__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid var(--tf-border, rgba(255, 255, 255, 0.06));
  background:
    linear-gradient(180deg, rgba(0, 229, 255, 0.08) 0%, transparent 100%),
    rgba(0, 0, 0, 0.2);
}

.tf-assign-dialog__eyebrow {
  margin: 0 0 0.15rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tf-primary, #00e5ff);
}

.tf-assign-dialog__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--tf-on-surface, #fff);
}

.tf-assign-dialog__close {
  flex-shrink: 0;
  margin-top: -0.15rem;
}

.tf-assign-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.9rem 1rem 0.35rem;
}

.tf-assign-exercise {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.tf-assign-exercise__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  flex-shrink: 0;
  color: var(--tf-on-primary, #0b0d12);
  background: var(--tf-primary, #00e5ff);
}

.tf-assign-exercise__name {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.25;
  word-break: break-word;
}

.tf-assign-exercise__meta {
  margin: 0.15rem 0 0;
  font-size: 0.7rem;
  color: var(--tf-on-surface-muted, #8b929e);
}

.tf-assign-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.tf-assign-section--stack {
  gap: 0.55rem;
}

.field-cap {
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--tf-on-surface-muted, #8b929e);
  margin-bottom: 0.2rem;
  line-height: 1.2;
}

.field-block {
  display: block;
  width: 100%;
  min-width: 0;
}

.tf-segment {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  padding: 0.3rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.tf-segment__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 2.25rem;
  padding: 0.35rem 0.5rem;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--tf-on-surface-muted, #8b929e);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.tf-segment__btn:hover {
  color: var(--tf-on-surface, #fff);
  background: rgba(0, 229, 255, 0.08);
}

.tf-segment__btn--active {
  color: var(--tf-on-primary, #0b0d12);
  background: var(--tf-primary, #00e5ff);
}

.tf-assign-hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--tf-on-surface-muted, #8b929e);
  line-height: 1.35;
}

.tf-assign-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: 0.45rem;
  padding: 0.55rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.metric {
  display: block;
  min-width: 0;
}

.tf-assign-dialog__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.85rem 1rem 1rem;
  border-top: 1px solid var(--tf-border, rgba(255, 255, 255, 0.06));
  background: rgba(0, 0, 0, 0.18);
}

.tf-btn-muted {
  border-color: rgba(255, 255, 255, 0.14) !important;
  color: #c5cad3 !important;
}

.min-w-0 {
  min-width: 0;
}

.tf-assign-dialog :deep(.v-field) {
  border-radius: 10px;
  font-size: 0.85rem;
}

.tf-assign-dialog :deep(.metric .v-field__input) {
  text-align: center;
  font-variant-numeric: tabular-nums;
  padding-inline: 0.35rem !important;
  min-width: 0;
}

.tf-assign-dialog :deep(.metric input) {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 420px) {
  .tf-assign-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
