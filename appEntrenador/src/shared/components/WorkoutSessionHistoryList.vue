<script setup>
/**
 * Historial de sesiones expandible.
 * Variante `dense`: timeline compacta (Resumen 360 trainer).
 * Variante normal: cards (progreso cliente 021).
 */
import { computed, shallowRef } from 'vue';

const props = defineProps({
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
  /** Timeline densa con rail; ideal Resumen trainer. */
  dense: {
    type: Boolean,
    default: false,
  },
  groupByDay: {
    type: Boolean,
    default: false,
  },
  hasMore: {
    type: Boolean,
    default: false,
  },
  loadingMore: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['load-more']);

const expandedId = shallowRef(null);

function sessionDayKey(value) {
  if (!value) return 'unknown';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return 'unknown';
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayHeadingLabel(dayKey) {
  if (dayKey === 'unknown') return 'Sin fecha';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const todayKey = sessionDayKey(today);
  const yesterdayKey = sessionDayKey(yesterday);
  if (dayKey === todayKey) return 'Hoy';
  if (dayKey === yesterdayKey) return 'Ayer';
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

const sessionGroups = computed(() => {
  if (!props.groupByDay) {
    return [{ key: 'all', label: null, sessions: props.sessions }];
  }
  const groups = [];
  const indexByKey = new Map();
  for (const session of props.sessions) {
    const raw = session?.finished_at || session?.started_at || session?.created_at;
    const key = sessionDayKey(raw);
    let group = indexByKey.get(key);
    if (!group) {
      group = { key, label: dayHeadingLabel(key), sessions: [] };
      indexByKey.set(key, group);
      groups.push(group);
    }
    group.sessions.push(session);
  }
  return groups;
});

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

function formatSessionTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
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

function exerciseCounts(session) {
  const sets = session?.sets || [];
  const names = new Set(sets.map((s) => s.exercise_name).filter(Boolean));
  return {
    setCount: sets.length,
    exCount: names.size,
  };
}

function exerciseSummary(session) {
  const { setCount, exCount } = exerciseCounts(session);
  const parts = [
    `${setCount} ${setCount === 1 ? 'serie' : 'series'}`,
  ];
  if (exCount > 0) {
    parts.push(`${exCount} ${exCount === 1 ? 'ejercicio' : 'ejercicios'}`);
  }
  return parts.join(' · ');
}

function denseStats(session) {
  const { setCount, exCount } = exerciseCounts(session);
  return `${setCount}s · ${exCount}ej`;
}

function sessionStamp(session) {
  return session.finished_at || session.started_at || session.created_at;
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

function sessionMetaLine(session) {
  const raw = sessionStamp(session);
  if (props.groupByDay) {
    const time = formatSessionTime(raw);
    return time !== '—'
      ? `${time} · ${exerciseSummary(session)}`
      : exerciseSummary(session);
  }
  return `${formatSessionDate(raw, props.compact)} · ${exerciseSummary(session)}`;
}
</script>

<template>
  <div
    class="workout-history"
    :class="{
      'workout-history--compact': compact && !dense,
      'workout-history--dense': dense,
    }"
  >
    <div v-if="sessions.length === 0" class="workout-history__empty text-medium-emphasis">
      {{ emptyText }}
    </div>

    <template v-else>
      <!-- Dense timeline (trainer Resumen) -->
      <template v-if="dense">
        <div
          v-for="group in sessionGroups"
          :key="group.key"
          class="wh-day"
        >
          <div v-if="group.label" class="wh-day__head">
            <span class="wh-day__label">{{ group.label }}</span>
            <span class="wh-day__count">{{ group.sessions.length }}</span>
          </div>

          <ul class="wh-list" role="list">
            <li
              v-for="session in group.sessions"
              :key="session.id"
              class="wh-row"
              :class="{ 'wh-row--open': expandedId === session.id }"
            >
              <button
                type="button"
                class="wh-row__btn"
                :aria-expanded="expandedId === session.id"
                @click="toggle(session.id)"
              >
                <span
                  class="wh-dot"
                  :class="{
                    'wh-dot--ok': session.status === 'completed',
                    'wh-dot--bad': session.status === 'abandoned',
                  }"
                />
                <span class="wh-row__name">{{ session.routine_name || 'Sesión' }}</span>
                <span
                  v-if="session.status === 'abandoned'"
                  class="wh-pill wh-pill--bad"
                >
                  Abandonada
                </span>
                <span class="wh-row__time">{{ formatSessionTime(sessionStamp(session)) }}</span>
                <span class="wh-row__stats">{{ denseStats(session) }}</span>
                <v-icon
                  class="wh-row__chev"
                  :icon="expandedId === session.id ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  size="16"
                />
              </button>

              <div v-if="expandedId === session.id" class="wh-detail">
                <div
                  v-for="(exGroup, gIndex) in groupedSets(session.sets)"
                  :key="`${session.id}-${exGroup.exercise_name}-${gIndex}`"
                  class="wh-detail__ex"
                >
                  <span class="wh-detail__name">{{ exGroup.exercise_name }}</span>
                  <span class="wh-detail__sets">
                    <span
                      v-for="set in exGroup.sets"
                      :key="set.id"
                      class="wh-detail__chip"
                    >
                      S{{ set.set_number }} {{ set.reps }}×{{ set.weight }}
                    </span>
                  </span>
                </div>
                <p
                  v-if="!(session.sets && session.sets.length)"
                  class="wh-detail__empty"
                >
                  Sin series registradas.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </template>

      <!-- Classic cards (client progress) -->
      <template v-else>
        <div
          v-for="group in sessionGroups"
          :key="group.key"
          class="workout-history-group-day"
        >
          <h3
            v-if="group.label"
            class="workout-history-day"
          >
            {{ group.label }}
          </h3>

          <div
            v-for="session in group.sessions"
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
                  {{ sessionMetaLine(session) }}
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
                v-for="(exGroup, gIndex) in groupedSets(session.sets)"
                :key="`${session.id}-${exGroup.exercise_name}-${gIndex}`"
                class="workout-history-group"
              >
                <div class="workout-history-exercise">{{ exGroup.exercise_name }}</div>
                <div class="workout-history-set-row">
                  <span
                    v-for="set in exGroup.sets"
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

      <div v-if="hasMore" class="workout-history__more">
        <v-btn
          variant="text"
          color="primary"
          size="small"
          :loading="loadingMore"
          @click="emit('load-more')"
        >
          Ver más
        </v-btn>
      </div>
    </template>
  </div>
</template>

<style scoped>
.workout-history__empty {
  font-size: 0.8rem;
}

/* ——— Dense timeline ——— */
.workout-history--dense .wh-day + .wh-day {
  margin-top: 0.65rem;
}

.wh-day__head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
  padding-left: 0.15rem;
}

.wh-day__label {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8b929e;
}

.wh-day__count {
  font-size: 0.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #5c6370;
  min-width: 1.1rem;
  height: 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}

.wh-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.16);
}

.wh-row + .wh-row {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.wh-row__btn {
  width: 100%;
  display: grid;
  grid-template-columns: 0.75rem minmax(0, 1fr) auto auto auto 1rem;
  align-items: center;
  gap: 0.45rem;
  padding: 0.42rem 0.55rem;
  margin: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.wh-row__btn:hover {
  background: rgba(0, 229, 255, 0.05);
}

.wh-row--open .wh-row__btn {
  background: rgba(0, 229, 255, 0.06);
}

.wh-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #5c6370;
  justify-self: center;
}

.wh-dot--ok {
  background: #00e5ff;
  box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.15);
}

.wh-dot--bad {
  background: #ff8a80;
  box-shadow: 0 0 0 3px rgba(255, 138, 128, 0.15);
}

.wh-row__name {
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wh-pill {
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 0.08rem 0.3rem;
  border-radius: 4px;
  white-space: nowrap;
}

.wh-pill--bad {
  color: #ffc9c4;
  background: rgba(255, 92, 92, 0.2);
}

.wh-row__time {
  font-size: 0.72rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #a8afba;
  white-space: nowrap;
}

.wh-row__stats {
  font-size: 0.68rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #8b929e;
  white-space: nowrap;
}

.wh-row__chev {
  color: #8b929e;
  justify-self: end;
}

.wh-detail {
  padding: 0 0.55rem 0.5rem 1.55rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.wh-detail__ex {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.wh-detail__name {
  font-size: 0.72rem;
  font-weight: 700;
  color: #c5cad3;
}

.wh-detail__sets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.wh-detail__chip {
  font-size: 0.65rem;
  color: #a8afba;
  padding: 0.08rem 0.3rem;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.04);
  font-variant-numeric: tabular-nums;
}

.wh-detail__empty {
  margin: 0;
  font-size: 0.7rem;
  color: #8b929e;
}

@media (max-width: 420px) {
  .wh-row__btn {
    grid-template-columns: 0.75rem minmax(0, 1fr) auto 1rem;
    grid-template-areas:
      "dot name name chev"
      "dot time stats chev";
    row-gap: 0.1rem;
  }

  .wh-dot { grid-area: dot; align-self: start; margin-top: 0.35rem; }
  .wh-row__name { grid-area: name; }
  .wh-row__time { grid-area: time; }
  .wh-row__stats { grid-area: stats; }
  .wh-row__chev { grid-area: chev; align-self: start; margin-top: 0.15rem; }
  .wh-pill { display: none; }
}

/* ——— Classic cards ——— */
.workout-history-group-day + .workout-history-group-day {
  margin-top: 0.55rem;
}

.workout-history-day {
  margin: 0 0 0.35rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #8b929e;
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

.workout-history__more {
  margin-top: 0.45rem;
  display: flex;
  justify-content: center;
}
</style>
