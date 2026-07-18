<script setup>
/**
 * Meta semanal editable + resumen de racha/score (Feature 042).
 */
import { onMounted, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import {
  getClientConsistency,
  updateClientWeekGoal,
} from '../api/consistencyApi.js';

const props = defineProps({
  clientId: { type: Number, required: true },
});

const emit = defineEmits(['notify', 'updated']);

const loading = shallowRef(true);
const saving = shallowRef(false);
const loadError = shallowRef('');
const weekGoal = shallowRef(3);
const summary = shallowRef(null);

async function load() {
  if (!props.clientId) return;
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getClientConsistency(props.clientId);
    const data = response.data?.data ?? null;
    summary.value = data;
    weekGoal.value = Number(data?.week_goal) || 3;
  } catch (error) {
    console.error('Error cargando consistencia:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar la consistencia');
  } finally {
    loading.value = false;
  }
}

async function save() {
  const goal = Math.round(Number(weekGoal.value));
  if (!Number.isInteger(goal) || goal < 1 || goal > 14) {
    emit('notify', { text: 'La meta semanal debe ser entre 1 y 14', color: 'warning' });
    return;
  }
  try {
    saving.value = true;
    const response = await updateClientWeekGoal(props.clientId, goal);
    const data = response.data?.data ?? null;
    summary.value = data;
    weekGoal.value = Number(data?.week_goal) || goal;
    emit('updated', data);
    emit('notify', { text: 'Meta semanal actualizada', color: 'success' });
  } catch (error) {
    console.error('Error guardando meta semanal:', error);
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo guardar la meta semanal'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
}

onMounted(load);
watch(() => props.clientId, load);
</script>

<template>
  <v-card variant="flat" class="consistency-panel">
    <div class="consistency-panel__head">
      <h3 class="consistency-panel__title">
        <v-icon icon="mdi-fire" size="18" class="mr-1" />
        Consistencia
      </h3>
      <span v-if="summary" class="consistency-panel__score">
        Score {{ summary.score }}
      </span>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" height="2" class="mb-2" />

    <v-alert
      v-else-if="loadError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-2"
    >
      {{ loadError }}
    </v-alert>

    <template v-else-if="summary">
      <p class="consistency-panel__meta">
        Racha {{ summary.current_streak }} días
        · Mejor {{ summary.best_streak }}
        · Esta semana {{ summary.workouts_this_week }}/{{ summary.week_goal }}
      </p>

      <div class="consistency-panel__form">
        <v-text-field
          v-model.number="weekGoal"
          type="number"
          min="1"
          max="14"
          step="1"
          label="Meta semanal (entrenos)"
          density="compact"
          variant="outlined"
          hide-details="auto"
          class="consistency-panel__field"
        />
        <v-btn
          color="primary"
          class="font-weight-bold"
          :loading="saving"
          @click="save"
        >
          Guardar
        </v-btn>
      </div>
    </template>
  </v-card>
</template>

<style scoped>
.consistency-panel {
  padding: 12px;
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 0.75rem;
}

.consistency-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.consistency-panel__title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
  display: flex;
  align-items: center;
}

.consistency-panel__score {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.consistency-panel__meta {
  margin: 0 0 0.65rem;
  font-size: 0.75rem;
  color: #8b929e;
}

.consistency-panel__form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.55rem;
}

.consistency-panel__field {
  flex: 1 1 10rem;
  max-width: 14rem;
}
</style>
