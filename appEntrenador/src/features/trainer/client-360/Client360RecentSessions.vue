<script setup>
/**
 * Actividad reciente del alumno en Resumen 360:
 * solo Hoy + Ayer visibles; resto colapsado.
 * Diferencia Completada vs Sin completar (abandoned).
 */
import { computed, shallowRef } from 'vue';

const props = defineProps({
  sessions: {
    type: Array,
    default: () => [],
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
const showOlder = shallowRef(false);

function localDayKey(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sessionStamp(session) {
  return session?.finished_at || session?.started_at || session?.created_at;
}

const todayKey = computed(() => localDayKey(new Date()));

const yesterdayKey = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDayKey(d);
});

const buckets = computed(() => {
  const today = [];
  const yesterday = [];
  const older = [];
  for (const session of props.sessions || []) {
    const key = localDayKey(sessionStamp(session));
    if (key === todayKey.value) today.push(session);
    else if (key === yesterdayKey.value) yesterday.push(session);
    else older.push(session);
  }
  return { today, yesterday, older };
});

const olderCount = computed(() => {
  const n = buckets.value.older.length;
  return props.hasMore ? `${n}+` : String(n);
});

const hasOlder = computed(() => (
  buckets.value.older.length > 0 || props.hasMore
));

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function isIncomplete(session) {
  return session?.status === 'abandoned';
}

function statsLabel(session) {
  const sets = session?.sets || [];
  const names = new Set(sets.map((s) => s.exercise_name).filter(Boolean));
  const setCount = sets.length;
  const exCount = names.size;
  if (!setCount && !exCount) return 'Sin series';
  return `${setCount}s · ${exCount}ej`;
}

function groupedSets(sets) {
  const groups = [];
  for (const set of sets || []) {
    const last = groups[groups.length - 1];
    if (last && last.exercise_name === set.exercise_name) {
      last.sets.push(set);
    } else {
      groups.push({ exercise_name: set.exercise_name, sets: [set] });
    }
  }
  return groups;
}

function toggle(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

function toggleOlder() {
  showOlder.value = !showOlder.value;
}
</script>

<template>
  <section class="recent" aria-labelledby="recent-title">
    <header class="recent__head">
      <h2 id="recent-title" class="recent__title">Actividad reciente</h2>
      <span class="recent__hint">Hoy y ayer</span>
    </header>

    <div class="recent__grid">
      <div
        v-for="day in [
          { key: 'today', label: 'Hoy', list: buckets.today, empty: 'Sin entrenamientos hoy' },
          { key: 'yesterday', label: 'Ayer', list: buckets.yesterday, empty: 'Sin entrenamientos ayer' },
        ]"
        :key="day.key"
        class="recent-day"
      >
        <div class="recent-day__head">
          <span class="recent-day__label">{{ day.label }}</span>
          <span class="recent-day__count">{{ day.list.length }}</span>
        </div>

        <p v-if="day.list.length === 0" class="recent-day__empty">
          {{ day.empty }}
        </p>

        <ul v-else class="recent-list" role="list">
          <li
            v-for="session in day.list"
            :key="session.id"
            class="recent-item"
            :class="{
              'recent-item--incomplete': isIncomplete(session),
              'recent-item--expanded': expandedId === session.id,
            }"
          >
            <button
              type="button"
              class="recent-item__btn"
              :aria-expanded="expandedId === session.id"
              @click="toggle(session.id)"
            >
              <span
                class="recent-item__icon"
                :class="isIncomplete(session) ? 'recent-item__icon--warn' : 'recent-item__icon--ok'"
                aria-hidden="true"
              >
                <v-icon
                  :icon="isIncomplete(session) ? 'mdi-progress-close' : 'mdi-check-circle'"
                  size="18"
                />
              </span>
              <span class="recent-item__body">
                <span class="recent-item__name">{{ session.routine_name || 'Sesión' }}</span>
                <span class="recent-item__meta">
                  <span class="recent-item__time">{{ formatTime(sessionStamp(session)) }}</span>
                  <span class="recent-item__dot">·</span>
                  <span>{{ statsLabel(session) }}</span>
                </span>
              </span>
              <span
                class="recent-item__badge"
                :class="isIncomplete(session) ? 'recent-item__badge--warn' : 'recent-item__badge--ok'"
              >
                {{ isIncomplete(session) ? 'Sin completar' : 'Completada' }}
              </span>
            </button>

            <div v-if="expandedId === session.id" class="recent-detail">
              <div
                v-for="(group, gIndex) in groupedSets(session.sets)"
                :key="`${session.id}-${group.exercise_name}-${gIndex}`"
                class="recent-detail__ex"
              >
                <span class="recent-detail__name">{{ group.exercise_name }}</span>
                <span class="recent-detail__sets">
                  <span
                    v-for="set in group.sets"
                    :key="set.id"
                    class="recent-detail__chip"
                  >
                    S{{ set.set_number }} {{ set.reps }}×{{ set.weight }}
                  </span>
                </span>
              </div>
              <p v-if="!(session.sets && session.sets.length)" class="recent-detail__empty">
                Sin series registradas.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="hasOlder" class="recent-older">
      <button
        type="button"
        class="recent-older__toggle"
        :aria-expanded="showOlder"
        @click="toggleOlder"
      >
        <v-icon
          :icon="showOlder ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="16"
        />
        {{ showOlder ? 'Ocultar anteriores' : `Días anteriores (${olderCount})` }}
      </button>

      <ul v-if="showOlder" class="recent-list recent-list--older" role="list">
        <li
          v-for="session in buckets.older"
          :key="session.id"
          class="recent-item"
          :class="{
            'recent-item--incomplete': isIncomplete(session),
            'recent-item--expanded': expandedId === session.id,
          }"
        >
          <button
            type="button"
            class="recent-item__btn"
            :aria-expanded="expandedId === session.id"
            @click="toggle(session.id)"
          >
            <span
              class="recent-item__icon"
              :class="isIncomplete(session) ? 'recent-item__icon--warn' : 'recent-item__icon--ok'"
              aria-hidden="true"
            >
              <v-icon
                :icon="isIncomplete(session) ? 'mdi-progress-close' : 'mdi-check-circle'"
                size="18"
              />
            </span>
            <span class="recent-item__body">
              <span class="recent-item__name">{{ session.routine_name || 'Sesión' }}</span>
              <span class="recent-item__meta">
                <span>{{ formatShortDate(sessionStamp(session)) }}</span>
                <span class="recent-item__dot">·</span>
                <span class="recent-item__time">{{ formatTime(sessionStamp(session)) }}</span>
                <span class="recent-item__dot">·</span>
                <span>{{ statsLabel(session) }}</span>
              </span>
            </span>
            <span
              class="recent-item__badge"
              :class="isIncomplete(session) ? 'recent-item__badge--warn' : 'recent-item__badge--ok'"
            >
              {{ isIncomplete(session) ? 'Sin completar' : 'Completada' }}
            </span>
          </button>

          <div v-if="expandedId === session.id" class="recent-detail">
            <div
              v-for="(group, gIndex) in groupedSets(session.sets)"
              :key="`${session.id}-${group.exercise_name}-${gIndex}`"
              class="recent-detail__ex"
            >
              <span class="recent-detail__name">{{ group.exercise_name }}</span>
              <span class="recent-detail__sets">
                <span
                  v-for="set in group.sets"
                  :key="set.id"
                  class="recent-detail__chip"
                >
                  S{{ set.set_number }} {{ set.reps }}×{{ set.weight }}
                </span>
              </span>
            </div>
          </div>
        </li>

        <li v-if="hasMore" class="recent-older__more">
          <v-btn
            variant="text"
            color="primary"
            size="small"
            :loading="loadingMore"
            @click="emit('load-more')"
          >
            Cargar más
          </v-btn>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.recent {
  padding: 0.65rem 0.75rem 0.7rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.recent__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
}

.recent__title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
}

.recent__hint {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b929e;
}

.recent__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.55rem;
}

@media (min-width: 720px) {
  .recent__grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
  }
}

.recent-day {
  min-width: 0;
  padding: 0.5rem 0.55rem 0.55rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.recent-day__head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}

.recent-day__label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #c5cad3;
}

.recent-day__count {
  font-size: 0.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #8b929e;
  min-width: 1.15rem;
  height: 1.15rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}

.recent-day__empty {
  margin: 0;
  padding: 0.55rem 0.15rem 0.35rem;
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
}

.recent-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.recent-item {
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  overflow: hidden;
}

.recent-item--incomplete {
  border-color: rgba(255, 176, 32, 0.28);
  background: rgba(255, 176, 32, 0.06);
}

.recent-item--expanded {
  border-color: rgba(0, 229, 255, 0.22);
}

.recent-item__btn {
  width: 100%;
  display: grid;
  grid-template-columns: 1.4rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.45rem;
  margin: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.recent-item__btn:hover {
  background: rgba(255, 255, 255, 0.03);
}

.recent-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.recent-item__icon--ok {
  color: #00e5ff;
}

.recent-item__icon--warn {
  color: #ffb020;
}

.recent-item__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.recent-item__name {
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-item__meta {
  font-size: 0.68rem;
  color: #8b929e;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-item__time {
  font-weight: 600;
  color: #a8afba;
}

.recent-item__dot {
  margin: 0 0.15rem;
  color: #5c6370;
}

.recent-item__badge {
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 0.18rem 0.35rem;
  border-radius: 5px;
  white-space: nowrap;
  justify-self: end;
}

.recent-item__badge--ok {
  color: #0b0d12;
  background: rgba(0, 229, 255, 0.85);
}

.recent-item__badge--warn {
  color: #1a1205;
  background: rgba(255, 176, 32, 0.9);
}

.recent-detail {
  padding: 0 0.45rem 0.45rem 1.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.recent-detail__ex {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.recent-detail__name {
  font-size: 0.7rem;
  font-weight: 700;
  color: #c5cad3;
}

.recent-detail__sets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
}

.recent-detail__chip {
  font-size: 0.62rem;
  color: #a8afba;
  padding: 0.06rem 0.28rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  font-variant-numeric: tabular-nums;
}

.recent-detail__empty {
  margin: 0;
  font-size: 0.68rem;
  color: #8b929e;
}

.recent-older {
  margin-top: 0.55rem;
  padding-top: 0.35rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.recent-older__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  padding: 0.25rem 0;
  border: 0;
  background: transparent;
  color: #8b929e;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.recent-older__toggle:hover {
  color: #00e5ff;
}

.recent-list--older {
  margin-top: 0.4rem;
}

.recent-older__more {
  display: flex;
  justify-content: center;
  padding: 0.15rem 0;
}

@media (max-width: 420px) {
  .recent-item__btn {
    grid-template-columns: 1.25rem minmax(0, 1fr);
  }

  .recent-item__badge {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
