<script setup>
/**
 * Presentational expandable list of workout sessions + sets.
 * Used by client progress (021) and trainer client ficha.
 */
import { shallowRef } from 'vue';

defineProps({
  sessions: {
    type: Array,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: 'Aún no hay entrenamientos registrados.',
  },
});

const expandedId = shallowRef(null);

function formatSessionDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusLabel(status) {
  if (status === 'abandoned') return 'Abandonada';
  if (status === 'completed') return 'Completada';
  return status || '—';
}

function statusClass(status) {
  if (status === 'abandoned') return 'session-status--abandoned';
  return 'session-status--completed';
}

function exerciseSummary(session) {
  const sets = session?.sets || [];
  const names = new Set(sets.map((s) => s.exercise_name).filter(Boolean));
  const setCount = sets.length;
  const exCount = names.size;
  const parts = [
    `${setCount} ${setCount === 1 ? 'serie' : 'series'}`,
  ];
  if (exCount > 0) {
    parts.push(`${exCount} ${exCount === 1 ? 'ejercicio' : 'ejercicios'}`);
  }
  return parts.join(' · ');
}

/** Group consecutive sets by exercise name for readable detail. */
function groupedSets(sets) {
  const groups = [];
  for (const set of sets || []) {
    const last = groups[groups.length - 1];
    if (last && last.exercise_name === set.exercise_name) {
      last.sets.push(set);
    } else {
      groups.push({
        exercise_name: set.exercise_name,
        sets: [set],
      });
    }
  }
  return groups;
}

function toggle(sessionId) {
  expandedId.value = expandedId.value === sessionId ? null : sessionId;
}
</script>

<template>
  <div class="workout-history">
    <div v-if="sessions.length === 0" class="workout-history__empty text-medium-emphasis">
      {{ emptyText }}
    </div>

    <div
      v-for="session in sessions"
      :key="session.id"
      class="workout-history-item"
    >
      <button
        type="button"
        class="workout-history-header"
        :aria-expanded="expandedId === session.id"
        @click="toggle(session.id)"
      >
        <div class="min-w-0">
          <div class="workout-history-title">{{ session.routine_name }}</div>
          <div class="workout-history-meta">
            {{ formatSessionDate(session.finished_at) }}
            · {{ exerciseSummary(session) }}
          </div>
          <span
            class="session-status"
            :class="statusClass(session.status)"
          >
            {{ statusLabel(session.status) }}
          </span>
        </div>
        <v-icon
          :icon="expandedId === session.id ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="20"
          color="#8B929E"
        />
      </button>

      <div v-if="expandedId === session.id" class="workout-history-sets">
        <div
          v-for="(group, gIndex) in groupedSets(session.sets)"
          :key="`${session.id}-${group.exercise_name}-${gIndex}`"
          class="workout-history-group"
        >
          <div class="workout-history-exercise">{{ group.exercise_name }}</div>
          <div
            v-for="set in group.sets"
            :key="set.id"
            class="workout-history-set"
          >
            Serie {{ set.set_number }} · {{ set.reps }} reps · {{ set.weight }} kg
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workout-history__empty {
  font-size: 0.9rem;
}

.workout-history-item {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.18);
  margin-bottom: 0.75rem;
}

.workout-history-item:last-child {
  margin-bottom: 0;
}

.workout-history-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  background: transparent;
  border: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
  padding: 0;
}

.workout-history-title {
  font-weight: 600;
}

.workout-history-meta {
  font-size: 0.8rem;
  color: #8b929e;
  margin-top: 0.15rem;
}

.session-status {
  display: inline-block;
  margin-top: 0.35rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
}

.session-status--completed {
  color: #0b0d12;
  background: rgba(0, 229, 255, 0.85);
}

.session-status--abandoned {
  color: #e8eaed;
  background: rgba(139, 146, 158, 0.35);
}

.workout-history-sets {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0.75rem;
  margin-top: 0.75rem;
}

.workout-history-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.workout-history-exercise {
  font-weight: 600;
  font-size: 0.9rem;
}

.workout-history-set {
  font-size: 0.85rem;
  color: #8b929e;
  padding-left: 0.25rem;
}

.min-w-0 {
  min-width: 0;
}
</style>
