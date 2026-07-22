<script setup>
/**
 * Modal de check-in semanal (biofeedback + fotos opcionales).
 * Valida tamaño ≤5MB por foto antes de enviar.
 */
import { computed, ref, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { createCheckin } from '../api/checkinsApi.js';

const MAX_BYTES = 5 * 1024 * 1024;

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
    scrim="rgba(0,0,0,0.7)"
    :persistent="submitting"
  >
    <v-card class="checkin-dialog" color="surface">
      <v-card-title class="checkin-dialog__title">
        Check-in semanal
      </v-card-title>
      <v-card-subtitle class="pb-2">
        Cuéntale a tu entrenador cómo vas esta semana
      </v-card-subtitle>

      <v-card-text class="pt-2">
        <v-alert
          v-if="localError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ localError }}
        </v-alert>

        <div class="checkin-metric">
          <div class="checkin-metric__label">
            <v-icon icon="mdi-sleep" size="18" class="me-1" />
            Calidad de sueño
          </div>
          <v-rating
            v-model="sleepQuality"
            :length="5"
            :half-increments="false"
            color="primary"
            active-color="primary"
            hover
            density="comfortable"
          />
        </div>

        <div class="checkin-metric">
          <div class="checkin-metric__label">
            <v-icon icon="mdi-head-heart-outline" size="18" class="me-1" />
            Nivel de estrés
          </div>
          <v-rating
            v-model="stressLevel"
            :length="5"
            :half-increments="false"
            color="warning"
            active-color="warning"
            hover
            density="comfortable"
          />
        </div>

        <div class="checkin-metric">
          <div class="checkin-metric__label">
            <v-icon icon="mdi-food-apple-outline" size="18" class="me-1" />
            Adherencia a la dieta
          </div>
          <v-rating
            v-model="dietAdherence"
            :length="5"
            :half-increments="false"
            color="success"
            active-color="success"
            hover
            density="comfortable"
          />
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
          class="mt-3"
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

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="submitting" @click="close">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
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
.checkin-dialog__title {
  font-weight: 700;
  letter-spacing: -0.02em;
}

.checkin-metric {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.checkin-metric__label {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.checkin-photos__hint {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}
</style>
