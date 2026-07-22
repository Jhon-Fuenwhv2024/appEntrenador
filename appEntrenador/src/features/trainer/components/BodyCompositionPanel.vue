<script setup>
/**
 * Panel trainer: historial + alta/edición de composición corporal.
 */
import { computed, onMounted, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import BodyCompositionHistoryList from '../../../shared/components/BodyCompositionHistoryList.vue';
import {
  createClientBodyComposition,
  getClientBodyComposition,
  updateClientBodyComposition,
} from '../api/bodyCompositionApi.js';
import BodyCompositionFormDialog from './BodyCompositionFormDialog.vue';

const props = defineProps({
  clientId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['notify']);

const loading = shallowRef(false);
const saving = shallowRef(false);
const loadError = shallowRef('');
const logs = shallowRef([]);
const dialogOpen = shallowRef(false);
const editingLog = shallowRef(null);

const lastHeightCm = computed(() => {
  const first = logs.value[0];
  if (!first?.height_cm) return null;
  return Number(first.height_cm);
});

async function loadLogs() {
  if (!props.clientId) return;
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getClientBodyComposition(props.clientId);
    logs.value = response.data.data ?? [];
  } catch (error) {
    console.error('Error cargando composición corporal:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar la composición corporal');
    logs.value = [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingLog.value = null;
  dialogOpen.value = true;
}

function openEdit(log) {
  editingLog.value = log;
  dialogOpen.value = true;
}

async function onSubmit(payload) {
  try {
    saving.value = true;
    if (editingLog.value?.id) {
      await updateClientBodyComposition(props.clientId, editingLog.value.id, payload);
      emit('notify', { text: 'Medición actualizada', color: 'success' });
    } else {
      await createClientBodyComposition(props.clientId, payload);
      emit('notify', { text: 'Medición registrada', color: 'success' });
    }
    dialogOpen.value = false;
    editingLog.value = null;
    await loadLogs();
  } catch (error) {
    console.error('Error guardando composición corporal:', error);
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo guardar la medición'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.clientId,
  () => {
    loadLogs();
  },
);

onMounted(() => {
  loadLogs();
});
</script>

<template>
  <div class="bcp">
    <div class="bcp__head">
      <div class="min-w-0">
        <h3 class="bcp__title">Composición corporal</h3>
        <p class="bcp__hint">Altura se reutiliza del último registro</p>
      </div>
      <v-btn
        color="primary"
        class="font-weight-bold flex-shrink-0"
        prepend-icon="mdi-plus"
        size="small"
        @click="openCreate"
      >
        Nueva
      </v-btn>
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
      editable
      empty-text="Sin mediciones. Pulsa Nueva para registrar la primera."
      @edit="openEdit"
    />

    <BodyCompositionFormDialog
      v-model="dialogOpen"
      :editing-log="editingLog"
      :last-height-cm="lastHeightCm"
      :saving="saving"
      @submit="onSubmit"
    />
  </div>
</template>

<style scoped>
.bcp {
  margin-top: 1rem;
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.bcp__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.bcp__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
}

.bcp__hint {
  margin: 0.15rem 0 0;
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}
</style>
