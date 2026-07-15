<script setup>
/**
 * Checklist diario del cliente. No se renderiza si no hay hábitos asignados.
 */
import { computed, onMounted, ref, shallowRef } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { todayLocalDate } from '../../../shared/utils/localDate.js';
import { getTodayHabits, toggleHabit } from '../api/habitsApi.js';

const loading = shallowRef(false);
const loadError = shallowRef('');
const habits = ref([]);
const togglingId = shallowRef(null);
/** false hasta el primer load; evita flash si la lista viene vacía */
const ready = shallowRef(false);

const hasHabits = computed(() => habits.value.length > 0);
const showCard = computed(() => ready.value && (hasHabits.value || Boolean(loadError.value)));

async function loadHabits() {
  const date = todayLocalDate();
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getTodayHabits(date);
    habits.value = (response.data.data ?? []).map((h) => ({
      id: Number(h.id),
      title: h.title,
      is_completed: Boolean(h.is_completed),
    }));
  } catch (error) {
    console.error('Error cargando hábitos de hoy:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudieron cargar tus hábitos');
    habits.value = [];
  } finally {
    loading.value = false;
    ready.value = true;
  }
}

async function onToggle(habit) {
  if (!habit?.id || togglingId.value === habit.id) return;

  const previous = habit.is_completed;
  // Optimistic UI
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
  <!-- Sin hábitos: no renderizar nada (v-if). Error solo si ya hay lista o fallo con datos. -->
  <v-card
    v-if="showCard"
    class="dhc mb-6"
    variant="flat"
  >
    <v-card-title class="text-body-1 font-weight-bold px-4 pt-4 pb-1">
      Checklist de Hoy
    </v-card-title>
    <v-card-subtitle class="px-4 pb-2 dhc__subtitle">
      Marca lo que ya completaste hoy
    </v-card-subtitle>

    <v-progress-linear v-if="loading" indeterminate color="primary" height="2" />

    <v-alert
      v-if="loadError"
      type="error"
      variant="tonal"
      density="compact"
      class="ma-4 mt-2"
    >
      {{ loadError }}
      <template #append>
        <v-btn variant="text" size="x-small" @click="loadHabits">Reintentar</v-btn>
      </template>
    </v-alert>

    <v-list v-if="hasHabits" density="comfortable" class="dhc__list py-1 px-1">
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

.dhc__subtitle {
  opacity: 1;
  color: #8b929e !important;
  font-size: 0.75rem;
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
