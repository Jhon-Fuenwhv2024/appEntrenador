<script setup>
/**
 * Mini strip de consistencia + meta semanal bajo demanda (042 + 060).
 */
import { computed, onMounted, shallowRef, watch } from 'vue';
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
const editingGoal = shallowRef(false);

const weekProgressLabel = computed(() => {
  if (!summary.value) return '—';
  const n = summary.value.workouts_this_week ?? 0;
  const m = summary.value.week_goal ?? weekGoal.value;
  return `${n}/${m}`;
});

async function load() {
  if (!props.clientId) return;
  try {
    loading.value = true;
    loadError.value = '';
    editingGoal.value = false;
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

function startEditGoal() {
  weekGoal.value = Number(summary.value?.week_goal) || 3;
  editingGoal.value = true;
}

function cancelEditGoal() {
  weekGoal.value = Number(summary.value?.week_goal) || 3;
  editingGoal.value = false;
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
    editingGoal.value = false;
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
  <section
    class="cs"
    :class="{ 'cs--editing': editingGoal }"
    aria-labelledby="consistency-title"
  >
    <div class="cs__mini">
      <div class="cs__mini-left">
        <v-icon icon="mdi-fire" size="16" class="cs__ico" />
        <div class="cs__copy">
          <div class="cs__top">
            <h3 id="consistency-title" class="cs__title">Consistencia</h3>
            <span v-if="summary && !loading" class="cs__score">{{ summary.score }}</span>
          </div>
          <v-progress-linear
            v-if="loading"
            indeterminate
            color="primary"
            height="2"
            class="cs__loader"
          />
          <p v-else-if="loadError" class="cs__err">{{ loadError }}</p>
          <template v-else-if="summary && !editingGoal">
            <p class="cs__line">
              <span>{{ summary.current_streak }}d</span>
              <span class="cs__sep">·</span>
              <span class="cs__muted">mejor {{ summary.best_streak }}</span>
              <span class="cs__sep">·</span>
              <span>meta {{ weekProgressLabel }}</span>
            </p>
          </template>
          <div v-else-if="editingGoal" class="cs__goal-edit">
            <v-text-field
              v-model.number="weekGoal"
              type="number"
              min="1"
              max="14"
              step="1"
              density="compact"
              variant="outlined"
              hide-details
              class="cs__field"
              aria-label="Meta semanal"
            />
            <v-btn color="primary" size="x-small" :loading="saving" @click="save">
              OK
            </v-btn>
            <v-btn variant="text" size="x-small" :disabled="saving" @click="cancelEditGoal">
              ✕
            </v-btn>
          </div>
        </div>
      </div>
      <button
        v-if="summary && !loading && !loadError && !editingGoal"
        type="button"
        class="cs__icon-btn"
        aria-label="Editar meta semanal"
        @click="startEditGoal"
      >
        <v-icon icon="mdi-pencil-outline" size="16" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.cs {
  height: 100%;
  padding: 0.45rem 0.6rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.cs__mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  min-height: 2.5rem;
}

.cs__mini-left {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  min-width: 0;
  flex: 1;
}

.cs__ico {
  flex-shrink: 0;
  margin-top: 0.12rem;
  color: #ffb020;
}

.cs__copy {
  min-width: 0;
  flex: 1;
}

.cs__top {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cs__title {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.cs__score {
  font-size: 0.68rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-primary));
  padding: 0.05rem 0.35rem;
  border-radius: 999px;
  background: rgba(0, 229, 255, 0.12);
}

.cs__loader {
  margin-top: 0.35rem;
  max-width: 6rem;
}

.cs__line {
  margin: 0.12rem 0 0;
  font-size: 0.8rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #e8eaed;
  line-height: 1.25;
}

.cs__sep {
  color: #5c6370;
  font-weight: 500;
  margin: 0 0.1rem;
}

.cs__muted {
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-weight: 600;
}

.cs__err {
  margin: 0.1rem 0 0;
  font-size: 0.7rem;
  color: #ff8a80;
}

.cs__icon-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #c5cad3;
  cursor: pointer;
}

.cs__icon-btn:hover {
  border-color: rgba(0, 229, 255, 0.35);
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.08);
}

.cs__goal-edit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.25rem;
}

.cs__field {
  width: 3.75rem;
  flex: 0 0 auto;
}

.cs__field :deep(.v-field) {
  min-height: 30px !important;
}
</style>
