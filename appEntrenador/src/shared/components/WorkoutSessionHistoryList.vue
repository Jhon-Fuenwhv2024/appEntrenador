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
  compact: {
    type: Boolean,
    default: false,
  },
});

const expandedId = shallowRef(null);

function formatSessionDate(value, compact) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  if (compact) {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
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
  <div class="workout-history" :class="{ 'workout-history--compact': compact }">
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
        <div class="min-w-0 workout-history-main">
          <div class="workout-history-top">
            <span class="workout-history-title">{{ session.routine_name }}</span>
            <span
              class="session-status"
              :class="statusClass(session.status)"
            >
              {{ statusLabel(session.status) }}
            </span>
          </div>
          <div class="workout-history-meta">
            {{ formatSessionDate(session.finished_at, compact) }}
            · {{ exerciseSummary(session) }}
          </div>
        </div>
        <v-icon
          :icon="expandedId === session.id ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="18"
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
          <div class="workout-history-set-row">
            <span
              v-for="set in group.sets"
              :key="set.id"
              class="workout-history-set"
            >
              S{{ set.set_number }} {{ set.reps }}×{{ set.weight }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workout-history__empty {
  font-size: 0.8rem;
}

.workout-history-item {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  background: rgba(0, 0, 0, 0.18);
  margin-bottom: 0.45rem;
}

.workout-history-item:last-child {
  margin-bottom: 0;
}

.workout-history-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
  padding: 0;
}

.workout-history-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
}

.workout-history-title {
  font-weight: 600;
  font-size: 0.88rem;
  line-height: 1.2;
}

.workout-history-meta {
  font-size: 0.72rem;
  color: #8b929e;
  margin-top: 0.15rem;
}

.session-status {
  display: inline-block;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 0.1rem 0.35rem;
  border-radius: 5px;
  line-height: 1.2;
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
  gap: 0.45rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

.workout-history-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.workout-history-exercise {
  font-weight: 600;
  font-size: 0.78rem;
}

.workout-history-set-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.workout-history-set {
  font-size: 0.7rem;
  color: #a8afba;
  padding: 0.12rem 0.35rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  font-variant-numeric: tabular-nums;
}

.min-w-0 {
  min-width: 0;
}

.workout-history--compact .workout-history-item {
  padding: 0.45rem 0.6rem;
  margin-bottom: 0.35rem;
}
</style>
