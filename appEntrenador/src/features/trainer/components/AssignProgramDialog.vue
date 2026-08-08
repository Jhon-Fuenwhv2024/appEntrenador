<script setup>
/**
 * Feature 091 — Asignar programa/mesociclo a un alumno con memoria de progresión.
 */
import { computed, reactive, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getClients } from '../api/clientsApi.js';

const PROGRESSION_MODES = [
  {
    value: 'last_plus',
    label: 'Último peso + incremento',
    hint: 'Toma lo que levantó la vez pasada y le suma kg',
    icon: 'mdi-trending-up',
  },
  {
    value: 'same_as_last',
    label: 'Mismo peso que la última vez',
    hint: 'Repite el último registro del alumno',
    icon: 'mdi-equal',
  },
  {
    value: 'template',
    label: 'Peso del programa',
    hint: 'Ignora el historial y usa la prescripción de la fase',
    icon: 'mdi-file-document-outline',
  },
];

const INCREMENT_PRESETS = [1, 2.5, 5, 10];

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  program: { type: Object, default: null },
  saving: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'submit', 'notify']);

const clients = shallowRef([]);
const loadingClients = shallowRef(false);

const form = reactive({
  clientId: null,
  phaseId: null,
  startDate: '',
  progressionMode: 'last_plus',
  incrementKg: 2.5,
});

const phases = computed(() => props.program?.phases ?? []);

const phaseItems = computed(() => phases.value.map((phase) => ({
  title: `${phase.name} · ${phase.duration_weeks} sem.`,
  value: phase.id,
})));

const clientItems = computed(() => clients.value.map((client) => ({
  title: client.nombre || client.username,
  value: client.id,
})));

const selectedPhase = computed(() => (
  phases.value.find((phase) => phase.id === form.phaseId) || null
));

const canSubmit = computed(() => Boolean(form.clientId) && phases.value.length > 0);

function resetForm() {
  form.clientId = null;
  form.phaseId = phases.value[0]?.id ?? null;
  form.startDate = new Date().toISOString().slice(0, 10);
  form.progressionMode = 'last_plus';
  form.incrementKg = 2.5;
}

async function loadClients() {
  try {
    loadingClients.value = true;
    const response = await getClients();
    clients.value = response.data?.success ? (response.data.clients ?? []) : [];
  } catch (error) {
    clients.value = [];
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudieron cargar los alumnos'),
      color: 'error',
    });
  } finally {
    loadingClients.value = false;
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    resetForm();
    loadClients();
  },
);

function close() {
  if (props.saving) return;
  emit('update:modelValue', false);
}

function handleSubmit() {
  if (!canSubmit.value) return;
  emit('submit', {
    clientId: Number(form.clientId),
    phaseId: form.phaseId ? Number(form.phaseId) : undefined,
    start_date: form.startDate || undefined,
    progression_mode: form.progressionMode,
    progression_increment_kg: Number(form.incrementKg),
  });
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560"
    scrollable
    scrim="rgba(0, 0, 0, 0.62)"
    transition="dialog-bottom-transition"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="ap" bg-color="surface" rounded="xl">
      <v-card-item class="ap__head">
        <template #prepend>
          <div class="ap__head-icon" aria-hidden="true">
            <v-icon icon="mdi-account-arrow-right-outline" size="22" color="primary" />
          </div>
        </template>
        <v-card-title class="ap__title">Asignar programa</v-card-title>
        <v-card-subtitle class="ap__subtitle">
          {{ program?.name || 'Programa' }} · se activa la semana 1
        </v-card-subtitle>
        <template #append>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Cerrar"
            :disabled="saving"
            @click="close"
          />
        </template>
      </v-card-item>

      <v-progress-linear
        v-if="loadingClients"
        indeterminate
        color="primary"
        height="2"
      />

      <v-card-text class="ap__body">
        <p v-if="!phases.length" class="ap__warn" role="alert">
          <v-icon icon="mdi-alert-outline" size="16" aria-hidden="true" />
          Este programa aún no tiene mesociclos con días. Añádelos antes de asignarlo.
        </p>

        <v-select
          v-model="form.clientId"
          :items="clientItems"
          label="Alumno"
          prepend-inner-icon="mdi-account-outline"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          class="mb-3"
          :disabled="saving || loadingClients"
        />

        <v-select
          v-if="phaseItems.length > 1"
          v-model="form.phaseId"
          :items="phaseItems"
          label="Mesociclo"
          prepend-inner-icon="mdi-view-week-outline"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          class="mb-3"
          :disabled="saving"
        />

        <v-text-field
          v-model="form.startDate"
          label="Fecha de inicio"
          type="date"
          prepend-inner-icon="mdi-calendar-outline"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          class="mb-4"
          :disabled="saving"
        />

        <p class="ap__label">Memoria de progresión</p>
        <div class="ap__modes" role="radiogroup" aria-label="Memoria de progresión">
          <button
            v-for="mode in PROGRESSION_MODES"
            :key="mode.value"
            type="button"
            role="radio"
            class="ap__mode"
            :class="{ 'ap__mode--on': form.progressionMode === mode.value }"
            :aria-checked="form.progressionMode === mode.value"
            :disabled="saving"
            @click="form.progressionMode = mode.value"
          >
            <v-icon :icon="mode.icon" size="20" aria-hidden="true" />
            <span class="ap__mode-text">
              <span class="ap__mode-label">{{ mode.label }}</span>
              <span class="ap__mode-hint">{{ mode.hint }}</span>
            </span>
          </button>
        </div>

        <template v-if="form.progressionMode === 'last_plus'">
          <p class="ap__label">Incremento por ejercicio</p>
          <div class="ap__chips" role="group" aria-label="Incremento en kilos">
            <button
              v-for="value in INCREMENT_PRESETS"
              :key="value"
              type="button"
              class="ap__chip"
              :class="{ 'ap__chip--on': Number(form.incrementKg) === value }"
              :aria-pressed="Number(form.incrementKg) === value"
              :disabled="saving"
              @click="form.incrementKg = value"
            >
              +{{ value }} kg
            </button>
          </div>
          <v-text-field
            v-model.number="form.incrementKg"
            label="Incremento personalizado"
            type="number"
            min="0"
            max="50"
            step="0.5"
            suffix="kg"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="mt-3"
            :disabled="saving"
          />
        </template>

        <p v-if="selectedPhase" class="ap__summary">
          <v-icon icon="mdi-information-outline" size="16" aria-hidden="true" />
          Se crearán las rutinas de la semana 1 de
          <strong>{{ selectedPhase.name }}</strong>
          ({{ selectedPhase.duration_weeks }} microciclos en total).
        </p>
      </v-card-text>

      <v-card-actions class="ap__actions">
        <v-btn variant="outlined" class="ap__btn" :disabled="saving" @click="close">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="ap__btn font-weight-bold"
          :loading="saving"
          :disabled="!canSubmit || saving"
          @click="handleSubmit"
        >
          Asignar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.ap {
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.ap__head {
  padding-top: 1rem !important;
  padding-bottom: 0.35rem !important;
}

.ap__head-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.12);
  border: 1px solid rgba(0, 229, 255, 0.28);
}

.ap__title {
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  color: var(--tf-on-surface, #fff);
}

.ap__subtitle {
  white-space: normal !important;
  opacity: 1 !important;
  color: var(--tf-on-surface-muted, #a8b0bc) !important;
  font-size: 0.78rem !important;
}

.ap__body {
  padding-top: 0.75rem !important;
}

.ap__label {
  margin: 0 0 0.45rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.ap__modes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ap__mode {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  min-height: 56px;
  padding: 0.6rem 0.8rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: var(--tf-on-surface, #e8eaed);
  text-align: left;
  cursor: pointer;
}

.ap__mode:hover:not(:disabled) {
  border-color: rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.07);
}

.ap__mode--on {
  border-color: rgba(0, 229, 255, 0.55);
  background:
    linear-gradient(135deg, rgba(0, 229, 255, 0.14), transparent 60%),
    rgba(255, 255, 255, 0.03);
}

.ap__mode-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ap__mode-label {
  font-size: 0.875rem;
  font-weight: 700;
}

.ap__mode-hint {
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.ap__mode--on .ap__mode-label {
  color: #00e5ff;
}

.ap__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.ap__chip {
  min-height: 40px;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--tf-on-surface, #e8eaed);
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
}

.ap__chip--on {
  border-color: rgba(0, 229, 255, 0.55);
  background: rgba(0, 229, 255, 0.16);
  color: #00e5ff;
}

.ap__mode:focus-visible,
.ap__chip:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.ap__mode:disabled,
.ap__chip:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ap__label:not(:first-of-type) {
  margin-top: 1rem;
}

.ap__summary,
.ap__warn {
  margin: 1rem 0 0;
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 0.6rem 0.75rem;
  border-radius: 12px;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ap__warn {
  margin: 0 0 1rem;
  border-color: rgba(255, 82, 82, 0.35);
  background: rgba(255, 82, 82, 0.08);
}

.ap__summary strong {
  color: var(--tf-on-surface, #fff);
}

.ap__actions {
  display: flex !important;
  gap: 0.65rem;
  padding: 0.75rem 1.25rem 1.25rem !important;
}

.ap__btn {
  flex: 1;
  min-height: 44px;
}

.ap :deep(.v-field--variant-outlined) {
  background: transparent;
}

.ap :deep(.v-label.v-field-label--floating) {
  font-size: 0.75rem !important;
  font-weight: 600;
  padding-inline: 0.2rem;
  background-color: rgb(var(--v-theme-surface)) !important;
}
</style>
