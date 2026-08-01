<script setup>
/**
 * Checklist diario del cliente. No se renderiza si no hay hábitos asignados.
 * Compact (home): peek fijo alineado con Racha → bottom sheet con lista completa.
 * Puede hidratarse desde GET /me/today (Feature 038) vía initialHabits + skipFetch.
 */
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { todayLocalDate } from '../../../shared/utils/localDate.js';
import { getTodayHabits, toggleHabit } from '../api/habitsApi.js';

const props = defineProps({
  /** Hábitos ya cargados por el agregador /me/today */
  initialHabits: {
    type: Array,
    default: null,
  },
  /** Si true, no llama a GET /habits/today (usa initialHabits). */
  skipFetch: {
    type: Boolean,
    default: false,
  },
  /** Densidad reducida para el home immersivo (peek + sheet). */
  compact: {
    type: Boolean,
    default: false,
  },
});

const loading = shallowRef(false);
const loadError = shallowRef('');
const habits = ref([]);
const togglingId = shallowRef(null);
/** false hasta el primer load; evita flash si la lista viene vacía */
const ready = shallowRef(false);
const sheetOpen = shallowRef(false);

const emit = defineEmits(['update:initialHabits']);

const hasHabits = computed(() => habits.value.length > 0);
const showCard = computed(() => ready.value && (hasHabits.value || Boolean(loadError.value)));
const doneCount = computed(() => habits.value.filter((h) => h.is_completed).length);
const progressPct = computed(() => {
  if (!habits.value.length) return 0;
  return Math.round((doneCount.value / habits.value.length) * 100);
});
const allDone = computed(
  () => hasHabits.value && doneCount.value >= habits.value.length,
);

/** Preview line: prefer first incomplete, else first habit. */
const peekTitle = computed(() => {
  if (!habits.value.length) return '';
  const pending = habits.value.find((h) => !h.is_completed);
  return (pending || habits.value[0]).title;
});

const peekHint = computed(() => {
  if (!hasHabits.value) return 'Sin hábitos hoy';
  if (allDone.value) return 'Todo listo hoy';
  const left = habits.value.length - doneCount.value;
  return left === 1 ? '1 pendiente · tocar' : `${left} pendientes · tocar`;
});

const sheetSubtitle = computed(() => {
  if (allDone.value) return '¡Día completado!';
  return 'Marca lo que ya completaste';
});

function closeSheet() {
  sheetOpen.value = false;
}

function habitIdsKey(list) {
  return (list ?? []).map((h) => Number(h?.id)).filter((id) => id > 0).join(',');
}

function mapHabits(list) {
  return (list ?? []).map((h) => ({
    id: Number(h.id),
    title: h.title,
    is_completed: Boolean(Number(h.is_completed) || h.is_completed === true),
  }));
}

function setHabitCompleted(habitId, completed) {
  const id = Number(habitId);
  habits.value = habits.value.map((h) => (
    h.id === id ? { ...h, is_completed: Boolean(completed) } : h
  ));
}

function syncHabitsToParent() {
  emit('update:initialHabits', habits.value.map((h) => ({ ...h })));
}

function applyInitialHabits(list) {
  habits.value = mapHabits(list);
  loading.value = false;
  loadError.value = '';
  ready.value = true;
}

async function loadHabits() {
  if (props.skipFetch) {
    applyInitialHabits(props.initialHabits);
    return;
  }

  const date = todayLocalDate();
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getTodayHabits(date);
    habits.value = mapHabits(response.data.data);
  } catch (error) {
    console.error('Error cargando hábitos de hoy:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudieron cargar tus hábitos');
    habits.value = [];
  } finally {
    loading.value = false;
    ready.value = true;
  }
}

watch(
  () => props.initialHabits,
  (next) => {
    if (!props.skipFetch) return;
    // No pisar checklist local si el set de hábitos es el mismo (evita re-marcar tras toggle).
    if (ready.value && habitIdsKey(next) === habitIdsKey(habits.value)) return;
    applyInitialHabits(next);
  },
);

async function onToggle(habit) {
  const id = Number(habit?.id);
  if (!id || togglingId.value === id) return;

  const current = habits.value.find((h) => h.id === id);
  if (!current) return;

  const previous = Boolean(current.is_completed);
  const next = !previous;
  setHabitCompleted(id, next);

  try {
    togglingId.value = id;
    const response = await toggleHabit(id, todayLocalDate(), next);
    const completed = response.data?.data?.completed;
    if (typeof completed === 'boolean') {
      setHabitCompleted(id, completed);
    }
    if (props.skipFetch) syncHabitsToParent();
  } catch (error) {
    setHabitCompleted(id, previous);
    console.error('Error al marcar hábito:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo actualizar el hábito');
  } finally {
    togglingId.value = null;
  }
}

function openSheet() {
  if (!props.compact || !hasHabits.value) return;
  sheetOpen.value = true;
}

onMounted(() => {
  loadHabits();
});
</script>

<template>
  <template v-if="showCard">
    <!-- Compact peek: same height as ConsistencyRing; opens sheet -->
    <button
      v-if="compact"
      type="button"
      class="dhc dhc--compact dhc--peek"
      :aria-expanded="sheetOpen"
      aria-haspopup="dialog"
      aria-label="Abrir hábitos del día"
      @click="openSheet"
    >
      <div class="dhc__head">
        <h3 class="dhc__title">Hábitos</h3>
        <span v-if="hasHabits" class="dhc__count">{{ doneCount }}/{{ habits.length }}</span>
      </div>

      <p v-if="loadError" class="dhc__peek-error">{{ loadError }}</p>
      <template v-else>
        <p class="dhc__peek-title">{{ peekTitle }}</p>
        <span class="dhc__peek-cta">
          {{ peekHint }}
          <v-icon icon="mdi-chevron-right" size="16" />
        </span>
      </template>
    </button>

    <!-- Full card (non-compact surfaces) -->
    <v-card
      v-else
      class="dhc"
      variant="flat"
    >
      <div class="dhc__head">
        <div>
          <h3 class="dhc__title">Hábitos</h3>
          <p class="dhc__subtitle">Marca lo que ya completaste hoy</p>
        </div>
        <span v-if="hasHabits" class="dhc__count">{{ doneCount }}/{{ habits.length }}</span>
      </div>

      <v-progress-linear v-if="loading" indeterminate color="primary" height="2" />

      <v-alert
        v-if="loadError"
        type="error"
        variant="tonal"
        density="compact"
        class="ma-2 mt-1"
      >
        {{ loadError }}
        <template #append>
          <v-btn variant="text" size="x-small" @click="loadHabits">Reintentar</v-btn>
        </template>
      </v-alert>

      <v-list
        v-if="hasHabits"
        density="comfortable"
        class="dhc__list py-0 px-1"
      >
        <v-list-item
          v-for="habit in habits"
          :key="habit.id"
          class="dhc__item"
          @click="onToggle(habit)"
        >
          <template #prepend>
            <v-checkbox-btn
              :model-value="habit.is_completed"
              color="primary"
              :disabled="togglingId === habit.id"
              density="compact"
              @click.stop="onToggle(habit)"
            />
          </template>
          <v-list-item-title
            class="text-body-2"
            :class="{ 'dhc__done': habit.is_completed }"
          >
            {{ habit.title }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Mini vista / sheet: lista completa usable en móvil -->
    <v-bottom-sheet
      v-if="compact"
      v-model="sheetOpen"
      scrim="rgba(0, 0, 0, 0.72)"
      content-class="dhc-sheet-wrap"
    >
      <div class="dhc-sheet" role="dialog" aria-modal="true" aria-labelledby="dhc-sheet-title">
        <div class="dhc-sheet__handle" aria-hidden="true" />

        <header class="dhc-sheet__hero">
          <div class="dhc-sheet__hero-top">
            <div class="dhc-sheet__brand">
              <span class="dhc-sheet__icon" aria-hidden="true">
                <v-icon icon="mdi-checkbox-marked-circle-outline" size="18" />
              </span>
              <div class="dhc-sheet__titles">
                <p class="dhc-sheet__eyebrow">Rutina diaria</p>
                <h3 id="dhc-sheet-title" class="dhc-sheet__title">Hábitos de hoy</h3>
              </div>
            </div>
            <button
              type="button"
              class="dhc-sheet__close"
              aria-label="Cerrar"
              @click="closeSheet"
            >
              <v-icon icon="mdi-close" size="18" />
            </button>
          </div>

          <p class="dhc-sheet__sub">{{ sheetSubtitle }}</p>

          <div
            v-if="hasHabits"
            class="dhc-sheet__progress"
            role="status"
            aria-live="polite"
          >
            <div class="dhc-sheet__progress-meta">
              <span class="dhc-sheet__progress-label">Progreso</span>
              <span class="dhc-sheet__progress-count">
                {{ doneCount }}/{{ habits.length }}
              </span>
            </div>
            <div
              class="dhc-sheet__progress-track"
              role="progressbar"
              :aria-valuenow="progressPct"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`${progressPct}% de hábitos completados`"
            >
              <div
                class="dhc-sheet__progress-fill"
                :class="{ 'dhc-sheet__progress-fill--done': allDone }"
                :style="{ width: `${progressPct}%` }"
              />
            </div>
          </div>
        </header>

        <v-alert
          v-if="loadError"
          type="error"
          variant="tonal"
          density="compact"
          class="mx-4 mb-2"
        >
          {{ loadError }}
          <template #append>
            <v-btn variant="text" size="x-small" @click="loadHabits">Reintentar</v-btn>
          </template>
        </v-alert>

        <ul
          v-if="hasHabits"
          class="dhc-sheet__list"
          role="list"
        >
          <li
            v-for="habit in habits"
            :key="habit.id"
            class="dhc-sheet__row"
            :class="{
              'dhc-sheet__row--done': habit.is_completed,
              'dhc-sheet__row--busy': togglingId === habit.id,
            }"
          >
            <button
              type="button"
              class="dhc-sheet__row-btn"
              :aria-pressed="habit.is_completed"
              :aria-label="`${habit.is_completed ? 'Desmarcar' : 'Marcar'} ${habit.title}`"
              :disabled="togglingId === habit.id"
              @click="onToggle(habit)"
            >
              <span class="dhc-sheet__check" aria-hidden="true">
                <v-icon
                  v-if="habit.is_completed"
                  icon="mdi-check"
                  size="14"
                />
              </span>
              <span class="dhc-sheet__row-title">{{ habit.title }}</span>
            </button>
          </li>
        </ul>

        <div class="dhc-sheet__footer">
          <v-btn
            color="primary"
            block
            rounded="lg"
            class="font-weight-bold dhc-sheet__cta"
            height="44"
            @click="closeSheet"
          >
            {{ allDone ? 'Genial' : 'Listo' }}
          </v-btn>
        </div>
      </div>
    </v-bottom-sheet>
  </template>
</template>

<style scoped>
.dhc {
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  width: 100%;
}

.dhc--compact {
  border-radius: 12px;
  min-height: 108px;
  max-height: 108px;
}

.dhc--peek {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
  padding: 0;
  margin: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dhc--peek:hover,
.dhc--peek:focus-visible {
  border-color: rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.06);
}

.dhc--peek:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.dhc--peek:active {
  transform: scale(0.985);
}

.dhc__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 4px;
  flex-shrink: 0;
}

.dhc--compact .dhc__head {
  padding: 8px 10px 2px;
}

.dhc__title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
}

.dhc__subtitle {
  margin: 2px 0 0;
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-size: 0.72rem;
}

.dhc__count {
  font-size: 0.72rem;
  font-weight: 700;
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.1);
  border-radius: 999px;
  padding: 2px 8px;
  flex-shrink: 0;
}

.dhc__peek-title {
  margin: 0;
  padding: 2px 10px 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #c5cad3;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.dhc__peek-error {
  margin: 0;
  padding: 4px 10px;
  font-size: 0.72rem;
  color: #ff8a80;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dhc__peek-cta {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: auto;
  padding: 4px 8px 8px 10px;
  font-size: 0.68rem;
  font-weight: 600;
  color: #00e5ff;
  letter-spacing: 0.02em;
}

.dhc__list {
  background: transparent;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.dhc__item {
  cursor: pointer;
  border-radius: 8px;
}

.dhc__item:hover {
  background: rgba(0, 229, 255, 0.06);
}

.dhc__done {
  text-decoration: line-through;
  opacity: 0.55;
}

/* ---- Bottom sheet (compact home) ---- */
.dhc-sheet {
  display: flex;
  flex-direction: column;
  max-height: min(72vh, 480px);
  min-width: 0;
  overflow: hidden;
  border-radius: 18px 18px 0 0;
  background:
    radial-gradient(120% 70% at 0% 0%, rgba(0, 229, 255, 0.12), transparent 55%),
    #0f1218;
  color: var(--tf-on-surface, #fff);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -10px 32px rgba(0, 0, 0, 0.4);
}

.dhc-sheet__handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
  margin: 8px auto 0;
  flex-shrink: 0;
}

.dhc-sheet__hero {
  flex-shrink: 0;
  padding: 8px 14px 10px;
  min-width: 0;
}

.dhc-sheet__hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.dhc-sheet__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.dhc-sheet__icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(0, 229, 255, 0.12);
  border: 1px solid rgba(0, 229, 255, 0.22);
  color: rgb(var(--v-theme-primary));
}

.dhc-sheet__titles {
  min-width: 0;
}

.dhc-sheet__eyebrow {
  margin: 0;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
}

.dhc-sheet__title {
  margin: 1px 0 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--tf-on-surface, #fff);
}

.dhc-sheet__close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: -2px -2px 0 0;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--tf-on-surface, #e8eaed);
  cursor: pointer;
}

.dhc-sheet__close:hover {
  background: rgba(0, 229, 255, 0.12);
}

.dhc-sheet__close:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}

.dhc-sheet__sub {
  margin: 6px 0 0;
  font-size: 0.75rem;
  line-height: 1.3;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.dhc-sheet__progress {
  margin-top: 10px;
  min-width: 0;
}

.dhc-sheet__progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 5px;
}

.dhc-sheet__progress-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.dhc-sheet__progress-count {
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  font-variant-numeric: tabular-nums;
}

.dhc-sheet__progress-track {
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.dhc-sheet__progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #00bcd4, #00e5ff);
  transition: width 0.25s ease;
}

.dhc-sheet__progress-fill--done {
  background: linear-gradient(90deg, #00c853, #00e5ff);
}

.dhc-sheet__list {
  list-style: none;
  margin: 0;
  padding: 0 12px 6px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dhc-sheet__row {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.035);
  overflow: hidden;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dhc-sheet__row--done {
  border-color: rgba(0, 229, 255, 0.28);
  background: rgba(0, 229, 255, 0.07);
}

.dhc-sheet__row--busy {
  opacity: 0.7;
}

.dhc-sheet__row-btn {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  column-gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
  font: inherit;
  box-sizing: border-box;
}

.dhc-sheet__row-btn:disabled {
  cursor: wait;
}

.dhc-sheet__row-btn:hover:not(:disabled) {
  background: rgba(0, 229, 255, 0.05);
}

.dhc-sheet__row-btn:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: -2px;
}

.dhc-sheet__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 2px solid var(--tf-border, rgba(255, 255, 255, 0.28));
  color: #0b0d12;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.dhc-sheet__row--done .dhc-sheet__check {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
}

.dhc-sheet__row-title {
  min-width: 0;
  font-size: 0.88rem;
  font-weight: 650;
  line-height: 1.25;
  color: var(--tf-on-surface, #e8eaed);
  overflow-wrap: anywhere;
}

.dhc-sheet__row--done .dhc-sheet__row-title {
  text-decoration: line-through;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.dhc-sheet__footer {
  flex-shrink: 0;
  padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.dhc-sheet__cta {
  letter-spacing: 0.01em;
}

@media (max-width: 390px) {
  .dhc-sheet__title {
    font-size: 1rem;
  }

  .dhc-sheet__row-btn {
    padding: 8px 10px;
  }

  .dhc-sheet__row-title {
    font-size: 0.84rem;
  }
}
</style>

<style>
/* Teleported bottom sheet content (Vuetify) */
.dhc-sheet-wrap {
  max-width: 560px;
  margin-inline: auto;
}

.dhc-sheet-wrap .v-bottom-sheet__content,
.dhc-sheet-wrap.v-bottom-sheet__content {
  border-radius: 18px 18px 0 0;
  overflow: hidden;
}
</style>
