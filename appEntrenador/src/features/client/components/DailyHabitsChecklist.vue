<script setup>
/**
 * Checklist diario del cliente. No se renderiza si no hay hábitos asignados.
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
  /** Densidad reducida para el home immersivo. */
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

const hasHabits = computed(() => habits.value.length > 0);
const showCard = computed(() => ready.value && (hasHabits.value || Boolean(loadError.value)));
const doneCount = computed(() => habits.value.filter((h) => h.is_completed).length);

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

onMounted(() => {
  loadHabits();
});
</script>

<template>
  <v-card
    v-if="showCard"
    class="dhc"
    :class="{ 'dhc--compact': compact }"
    variant="flat"
  >
    <div class="dhc__head">
      <div>
        <h3 class="dhc__title">Hábitos</h3>
        <p v-if="!compact" class="dhc__subtitle">Marca lo que ya completaste hoy</p>
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
      :density="compact ? 'compact' : 'comfortable'"
      class="dhc__list py-0 px-1"
    >
      <v-list-item
        v-for="habit in habits"
        :key="habit.id"
        class="dhc__item"
        :min-height="compact ? 40 : undefined"
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
</template>

<style scoped>
.dhc {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.dhc--compact {
  border-radius: 12px;
}

.dhc__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 4px;
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
}

.dhc__list {
  background: transparent;
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
</style>
