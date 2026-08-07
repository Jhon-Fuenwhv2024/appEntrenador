<script setup>
/**
 * Feature 076 — toggle “Permitir modo sombra” en perfil cliente.
 */
import { onMounted, shallowRef } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import {
  getShadowModeSettings,
  patchShadowModeSettings,
} from '../api/shadowModeApi.js';

const emit = defineEmits(['notify']);

const enabled = shallowRef(true);
const loading = shallowRef(true);
const saving = shallowRef(false);

async function load() {
  loading.value = true;
  try {
    const response = await getShadowModeSettings();
    enabled.value = response.data?.data?.shadow_mode_enabled !== false;
  } catch (error) {
    console.warn('[shadow] settings load:', error);
    emit('notify', getApiErrorMessage(error, 'No se pudo cargar modo sombra'), 'error');
  } finally {
    loading.value = false;
  }
}

async function onToggle(value) {
  const next = Boolean(value);
  const prev = enabled.value;
  enabled.value = next;
  saving.value = true;
  try {
    await patchShadowModeSettings({ shadow_mode_enabled: next });
    emit(
      'notify',
      next
        ? 'Modo sombra activado'
        : 'Modo sombra desactivado',
    );
  } catch (error) {
    enabled.value = prev;
    emit('notify', getApiErrorMessage(error, 'No se pudo guardar'), 'error');
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <v-card class="shadow-card mb-4" variant="outlined">
    <v-card-title class="text-subtitle-1">
      Modo sombra
    </v-card-title>
    <v-card-text>
      <p class="shadow-card__help mb-3">
        Si está activo, tu entrenador puede ver en vivo qué ejercicio haces
        y enviarte pistas cortas durante el entrenamiento. No hay videollamada.
      </p>
      <v-switch
        :model-value="enabled"
        color="primary"
        hide-details
        :loading="loading || saving"
        :disabled="loading || saving"
        label="Permitir modo sombra"
        @update:model-value="onToggle"
      />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.shadow-card {
  border-color: color-mix(in srgb, rgb(var(--v-theme-primary)) 25%, transparent);
}

.shadow-card__help {
  margin: 0;
  color: var(--tf-on-surface-muted);
  font-size: var(--tf-text-body, 0.95rem);
  line-height: 1.4;
}
</style>
