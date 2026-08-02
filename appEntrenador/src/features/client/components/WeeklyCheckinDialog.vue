<script setup>
/**
 * Modal de check-in semanal (biofeedback + fotos opcionales).
 * Feature 081: escala 1–5 en pills primary (alineado a Trainfit).
 * Valida tamaño ≤5MB por foto antes de enviar.
 */
import { computed, ref, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { createCheckin } from '../api/checkinsApi.js';

const MAX_BYTES = 5 * 1024 * 1024;
const SCALE = [1, 2, 3, 4, 5];

const METRIC_DEFS = [
  {
    key: 'sleep',
    label: 'Calidad de sueño',
    icon: 'mdi-sleep',
    groupLabel: 'Calidad de sueño, de 1 a 5',
  },
  {
    key: 'stress',
    label: 'Nivel de estrés',
    icon: 'mdi-head-heart-outline',
    groupLabel: 'Nivel de estrés, de 1 a 5',
  },
  {
    key: 'diet',
    label: 'Adherencia a la dieta',
    icon: 'mdi-food-apple-outline',
    groupLabel: 'Adherencia a la dieta, de 1 a 5',
  },
];

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'submitted', 'error']);

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const sleepQuality = shallowRef(3);
const stressLevel = shallowRef(3);
const dietAdherence = shallowRef(3);
const notes = shallowRef('');
/** @type {import('vue').Ref<string|undefined>} */
const photosPanel = shallowRef(undefined);
const frontFile = shallowRef(null);
const sideFile = shallowRef(null);
const backFile = shallowRef(null);
const submitting = shallowRef(false);
const localError = shallowRef('');

const snackbar = ref(false);
const snackbarText = shallowRef('');

/**
 * @param {'sleep'|'stress'|'diet'} key
 * @returns {number}
 */
function getMetricValue(key) {
  if (key === 'sleep') return sleepQuality.value;
  if (key === 'stress') return stressLevel.value;
  return dietAdherence.value;
}

/**
 * @param {'sleep'|'stress'|'diet'} key
 * @param {number} value
 */
function setMetricValue(key, value) {
  if (key === 'sleep') sleepQuality.value = value;
  else if (key === 'stress') stressLevel.value = value;
  else dietAdherence.value = value;
}

function todayLocalDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function resetForm() {
  sleepQuality.value = 3;
  stressLevel.value = 3;
  dietAdherence.value = 3;
  notes.value = '';
  photosPanel.value = undefined;
  frontFile.value = null;
  sideFile.value = null;
  backFile.value = null;
  localError.value = '';
}

watch(open, (isOpen) => {
  if (isOpen) resetForm();
});

function showSizeError(label) {
  snackbarText.value = `La foto "${label}" supera 5 MB. Elige una imagen más ligera.`;
  snackbar.value = true;
}

/**
 * @param {'front'|'side'|'back'} pose
 * @param {File|File[]|null} value
 */
function onFileChange(pose, value) {
  const file = Array.isArray(value) ? value[0] : value;
  const labels = { front: 'Frente', side: 'Perfil', back: 'Espalda' };

  if (!file) {
    if (pose === 'front') frontFile.value = null;
    if (pose === 'side') sideFile.value = null;
    if (pose === 'back') backFile.value = null;
    return;
  }

  if (file.size > MAX_BYTES) {
    showSizeError(labels[pose]);
    if (pose === 'front') frontFile.value = null;
    if (pose === 'side') sideFile.value = null;
    if (pose === 'back') backFile.value = null;
    return;
  }

  if (pose === 'front') frontFile.value = file;
  if (pose === 'side') sideFile.value = file;
  if (pose === 'back') backFile.value = file;
}

async function onSubmit() {
  localError.value = '';

  const files = [
    { pose: 'front', file: frontFile.value, label: 'Frente' },
    { pose: 'side', file: sideFile.value, label: 'Perfil' },
    { pose: 'back', file: backFile.value, label: 'Espalda' },
  ];

  for (const item of files) {
    if (item.file && item.file.size > MAX_BYTES) {
      showSizeError(item.label);
      return;
    }
  }

  const formData = new FormData();
  formData.append('sleep_quality', String(sleepQuality.value));
  formData.append('stress_level', String(stressLevel.value));
  formData.append('diet_adherence', String(dietAdherence.value));
  formData.append('created_at', todayLocalDate());
  if (notes.value?.trim()) {
    formData.append('notes', notes.value.trim());
  }
  for (const item of files) {
    if (item.file) {
      formData.append(item.pose, item.file);
    }
  }

  try {
    submitting.value = true;
    const response = await createCheckin(formData);
    emit('submitted', response.data.data);
    open.value = false;
  } catch (error) {
    console.error('Error enviando check-in:', error);
    const message = getApiErrorMessage(error, 'No se pudo enviar el check-in');
    localError.value = message;
    emit('error', message);
    snackbarText.value = message;
    snackbar.value = true;
  } finally {
    submitting.value = false;
  }
}

function close() {
  if (submitting.value) return;
  open.value = false;
}
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="520"
    scrim="rgba(0, 0, 0, 0.62)"
    transition="dialog-bottom-transition"
    :persistent="submitting"
  >
    <v-card
      class="checkin-dialog"
      bg-color="surface"
      rounded="xl"
    >
      <v-card-item class="checkin-dialog__head">
        <template #prepend>
          <div
            class="checkin-dialog__icon"
            aria-hidden="true"
          >
            <v-icon
              icon="mdi-clipboard-check-outline"
              size="22"
              color="primary"
            />
          </div>
        </template>
        <v-card-title class="checkin-dialog__title">
          Check-in semanal
        </v-card-title>
        <v-card-subtitle class="checkin-dialog__subtitle">
          Cuéntale a tu entrenador cómo vas esta semana
        </v-card-subtitle>
        <template #append>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Cerrar"
            :disabled="submitting"
            @click="close"
          />
        </template>
      </v-card-item>

      <v-card-text class="checkin-dialog__body">
        <v-alert
          v-if="localError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ localError }}
        </v-alert>

        <div
          v-for="metric in METRIC_DEFS"
          :key="metric.key"
          class="checkin-metric"
        >
          <div class="checkin-metric__top">
            <div class="checkin-metric__label">
              <v-icon
                :icon="metric.icon"
                size="18"
                class="checkin-metric__icon"
                aria-hidden="true"
              />
              {{ metric.label }}
            </div>
            <span
              class="checkin-metric__value"
              aria-hidden="true"
            >
              {{ getMetricValue(metric.key) }}/5
            </span>
          </div>

          <div
            class="checkin-scale"
            role="radiogroup"
            :aria-label="metric.groupLabel"
          >
            <button
              v-for="n in SCALE"
              :key="`${metric.key}-${n}`"
              type="button"
              class="checkin-scale__btn"
              :class="{ 'checkin-scale__btn--on': getMetricValue(metric.key) === n }"
              role="radio"
              :aria-checked="getMetricValue(metric.key) === n"
              :aria-label="`${n} de 5`"
              :disabled="submitting"
              @click="setMetricValue(metric.key, n)"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <v-textarea
          v-model="notes"
          label="Notas (opcional)"
          placeholder="Cómo te sientes, molestias, etc."
          rows="2"
          auto-grow
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mt-3 checkin-field"
          hide-details="auto"
          :disabled="submitting"
        />

        <v-expansion-panels
          v-model="photosPanel"
          class="mt-3 checkin-photos"
          variant="accordion"
        >
          <v-expansion-panel value="photos">
            <v-expansion-panel-title>
              Añadir fotos de progreso (Opcional)
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="checkin-photos__hint">
                JPG o PNG · máx. 5 MB por foto · frente, perfil y espalda
              </p>
              <v-file-input
                :model-value="frontFile"
                label="Frente"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                prepend-icon="mdi-human-male"
                variant="outlined"
                density="compact"
                color="primary"
                show-size
                clearable
                :disabled="submitting"
                class="mb-2"
                @update:model-value="(v) => onFileChange('front', v)"
              />
              <v-file-input
                :model-value="sideFile"
                label="Perfil"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                prepend-icon="mdi-human-male-height"
                variant="outlined"
                density="compact"
                color="primary"
                show-size
                clearable
                :disabled="submitting"
                class="mb-2"
                @update:model-value="(v) => onFileChange('side', v)"
              />
              <v-file-input
                :model-value="backFile"
                label="Espalda"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                prepend-icon="mdi-account-outline"
                variant="outlined"
                density="compact"
                color="primary"
                show-size
                clearable
                :disabled="submitting"
                @update:model-value="(v) => onFileChange('back', v)"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>

      <v-card-actions class="checkin-dialog__actions">
        <v-btn
          variant="outlined"
          class="checkin-dialog__cancel"
          :disabled="submitting"
          @click="close"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="checkin-dialog__submit font-weight-bold"
          :loading="submitting"
          :disabled="submitting"
          @click="onSubmit"
        >
          Enviar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar" color="error" timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>

<style scoped>
.checkin-dialog {
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.checkin-dialog__head {
  padding-top: 1rem !important;
  padding-bottom: 0.35rem !important;
}

.checkin-dialog__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.12);
  border: 1px solid rgba(0, 229, 255, 0.28);
}

.checkin-dialog__title {
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  line-height: 1.25 !important;
  letter-spacing: -0.02em;
  color: var(--tf-on-surface, #fff);
}

.checkin-dialog__subtitle {
  white-space: normal !important;
  opacity: 1 !important;
  color: var(--tf-on-surface-muted, #a8b0bc) !important;
  font-size: 0.78rem !important;
  line-height: 1.4 !important;
  max-width: 34ch;
}

.checkin-dialog__body {
  padding-top: 0.75rem !important;
}

.checkin-metric {
  padding: 0.75rem 0.85rem;
  margin-bottom: 0.55rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.checkin-metric__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
}

.checkin-metric__label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--tf-on-surface, #fff);
  min-width: 0;
}

.checkin-metric__icon {
  color: var(--tf-on-surface-muted, #a8b0bc);
  flex-shrink: 0;
}

.checkin-metric__value {
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-primary));
}

.checkin-scale {
  display: flex;
  gap: 0.4rem;
  width: 100%;
}

.checkin-scale__btn {
  flex: 1;
  min-height: 44px;
  min-width: 0;
  padding: 0.35rem 0.25rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--tf-on-surface, #e8eaed);
  font-size: 0.875rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.checkin-scale__btn:hover:not(:disabled) {
  border-color: rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.08);
}

.checkin-scale__btn--on {
  border-color: rgba(0, 229, 255, 0.55);
  background: rgba(0, 229, 255, 0.16);
  color: #00e5ff;
}

.checkin-scale__btn:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.checkin-scale__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.checkin-dialog :deep(.v-field--variant-outlined) {
  background: transparent;
}

.checkin-dialog :deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-opacity: 0.28;
}

.checkin-photos__hint {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.checkin-dialog__actions {
  display: flex !important;
  gap: 0.65rem;
  padding: 0.75rem 1.25rem 1.25rem !important;
}

.checkin-dialog__cancel,
.checkin-dialog__submit {
  flex: 1;
  min-height: 44px;
}

.checkin-dialog__cancel:focus-visible,
.checkin-dialog__submit:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

@media (max-width: 390px) {
  .checkin-dialog__subtitle {
    max-width: 100%;
  }

  .checkin-metric {
    padding: 0.65rem 0.7rem;
  }

  .checkin-scale {
    gap: 0.3rem;
  }

  .checkin-scale__btn {
    font-size: 0.8125rem;
  }
}
</style>
