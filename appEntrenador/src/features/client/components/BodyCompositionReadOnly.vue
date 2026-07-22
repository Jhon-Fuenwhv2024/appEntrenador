<script setup>
/**
 * Bloque solo lectura de composición corporal para el portal del cliente.
 * Sin botones de añadir / editar / eliminar.
 */
import { onMounted, shallowRef } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import BodyCompositionHistoryList from '../../../shared/components/BodyCompositionHistoryList.vue';
import { getMyBodyComposition } from '../api/bodyCompositionApi.js';

defineProps({
  /** Cuando true, el padre ya aporta el marco de layout. */
  embedded: {
    type: Boolean,
    default: false,
  },
});

const loading = shallowRef(false);
const loadError = shallowRef('');
const logs = shallowRef([]);

async function loadLogs() {
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getMyBodyComposition();
    logs.value = response.data.data ?? [];
  } catch (error) {
    console.error('Error cargando composición corporal del cliente:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar tu composición corporal');
    logs.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadLogs();
});

defineExpose({ reload: loadLogs });
</script>

<template>
  <div class="bcr" :class="{ 'bcr--embedded': embedded }">
    <div class="bcr__head">
      <h2 class="bcr__title">Composición corporal</h2>
      <p class="bcr__hint">Solo lectura · registra tu entrenador</p>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" height="2" />

    <v-alert v-else-if="loadError" type="error" variant="tonal" density="compact" class="mb-2">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" size="x-small" @click="loadLogs">Reintentar</v-btn>
      </template>
    </v-alert>

    <BodyCompositionHistoryList
      v-else
      :logs="logs"
      empty-text="Sin mediciones aún."
    />
  </div>
</template>

<style scoped>
.bcr {
  margin-top: 0.85rem;
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.bcr--embedded {
  margin-top: 0;
  height: 100%;
}

.bcr__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.25rem 0.75rem;
  margin-bottom: 0.65rem;
}

.bcr__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
}

.bcr__hint {
  margin: 0;
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}
</style>
