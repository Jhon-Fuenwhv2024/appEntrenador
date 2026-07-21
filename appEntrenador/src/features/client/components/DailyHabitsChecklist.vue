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

const hasHabits = computed(() => habits.value.length > 0);
const showCard = computed(() => ready.value && (hasHabits.value || Boolean(loadError.value)));
const doneCount = computed(() => habits.value.filter((h) => h.is_completed).length);

/** Preview line: prefer first incomplete, else first habit. */
const peekTitle = computed(() => {
  if (!habits.value.length) return '';
  const pending = habits.value.find((h) => !h.is_completed);
  return (pending || habits.value[0]).title;
});

const peekHint = computed(() => {
  if (!hasHabits.value) return 'Sin hábitos hoy';
  if (doneCount.value >= habits.value.length) return 'Todo listo hoy';
  const left = habits.value.length - doneCount.value;
  return left === 1 ? '1 pendiente · tocar' : `${left} pendientes · tocar`;
});

function mapHabits(list) {
  return (list ?? []).map((h) => ({
    id: Number(h.id),
    title: h.title,
    is_completed: Boolean(h.is_completed),
  }));
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
    if (props.skipFetch) applyInitialHabits(next);
  },
);

async function onToggle(habit) {
  if (!habit?.id || togglingId.value === habit.id) return;

  const previous = habit.is_completed;
  habit.is_completed = !previous;

  try {
    togglingId.value = habit.id;
    const response = await toggleHabit(habit.id, todayLocalDate());
    const completed = response.data.data?.completed;
    if (typeof completed === 'boolean') {
      habit.is_completed = completed;
    }
  } catch (error) {
    habit.is_completed = previous;
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
      scrim="rgba(0, 0, 0, 0.65)"
      content-class="dhc-sheet-wrap"
    >
      <v-card class="dhc-sheet" rounded="t-xl">
        <div class="dhc-sheet__handle" aria-hidden="true" />
        <div class="dhc-sheet__head">
          <div>
            <h3 class="dhc-sheet__title">Hábitos de hoy</h3>
            <p class="dhc-sheet__sub">Marca lo que ya completaste</p>
          </div>
          <span v-if="hasHabits" class="dhc__count">{{ doneCount }}/{{ habits.length }}</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Cerrar"
            @click="sheetOpen = false"
          />
        </div>

        <v-alert
          v-if="loadError"
          type="error"
          variant="tonal"
          density="compact"
          class="mx-3 mb-2"
        >
          {{ loadError }}
          <template #append>
            <v-btn variant="text" size="x-small" @click="loadHabits">Reintentar</v-btn>
          </template>
        </v-alert>

        <v-list
          v-if="hasHabits"
          density="comfortable"
          class="dhc-sheet__list py-0"
        >
          <v-list-item
            v-for="habit in habits"
            :key="habit.id"
            class="dhc__item dhc-sheet__item"
            @click="onToggle(habit)"
          >
            <template #prepend>
              <v-checkbox-btn
                :model-value="habit.is_completed"
                color="primary"
                :disabled="togglingId === habit.id"
                density="comfortable"
                @click.stop="onToggle(habit)"
              />
            </template>
            <v-list-item-title
              class="text-body-1"
              :class="{ 'dhc__done': habit.is_completed }"
            >
              {{ habit.title }}
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <div class="dhc-sheet__footer">
          <v-btn
            color="primary"
            block
            size="large"
            class="font-weight-bold"
            @click="sheetOpen = false"
          >
            Listo
          </v-btn>
        </div>
      </v-card>
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
  outline: none;
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
  color: #8b929e;
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

.dhc-sheet {
  background: #12151c !important;
  color: #fff;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  max-height: min(78vh, 560px);
  display: flex;
  flex-direction: column;
}

.dhc-sheet__handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  margin: 10px auto 4px;
  flex-shrink: 0;
}

.dhc-sheet__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px 12px 16px;
  flex-shrink: 0;
}

.dhc-sheet__head > div:first-child {
  flex: 1;
  min-width: 0;
}

.dhc-sheet__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.dhc-sheet__sub {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #8b929e;
}

.dhc-sheet__list {
  background: transparent;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 8px 8px;
}

.dhc-sheet__item {
  min-height: 52px;
  margin-bottom: 2px;
}

.dhc-sheet__footer {
  flex-shrink: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
</style>

<style>
/* Teleported bottom sheet content (Vuetify) */
.dhc-sheet-wrap {
  max-width: 560px;
  margin-inline: auto;
}
</style>
