<script setup>
/**
 * Panel trainer: listar / añadir / eliminar hábitos diarios del alumno.
 */
import { onMounted, ref, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import {
  createClientHabit,
  deleteHabit,
  getClientHabits,
} from '../api/habitsApi.js';

const props = defineProps({
  clientId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['notify']);

const loading = shallowRef(false);
const saving = shallowRef(false);
const deletingId = shallowRef(null);
const loadError = shallowRef('');
const habits = ref([]);
const newTitle = shallowRef('');

async function loadHabits() {
  if (!props.clientId) return;
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getClientHabits(props.clientId);
    habits.value = response.data.data ?? [];
  } catch (error) {
    console.error('Error cargando hábitos:', error);
    const status = error?.response?.status || error?.normalized?.code;
    loadError.value = status === 404
      ? 'API de hábitos no disponible. Reinicia el backend (npm start).'
      : getApiErrorMessage(error, 'No se pudieron cargar los hábitos');
    habits.value = [];
  } finally {
    loading.value = false;
  }
}

async function onAdd() {
  const title = String(newTitle.value || '').trim();
  if (!title) {
    emit('notify', { text: 'Escribe el nombre del hábito', color: 'warning' });
    return;
  }

  try {
    saving.value = true;
    const response = await createClientHabit(props.clientId, title);
    const created = response.data.data;
    if (created) {
      habits.value = [...habits.value, created];
    } else {
      await loadHabits();
    }
    newTitle.value = '';
    emit('notify', { text: 'Hábito añadido', color: 'success' });
  } catch (error) {
    console.error('Error creando hábito:', error);
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo añadir el hábito'),
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
}

async function onDelete(habit) {
  if (!habit?.id) return;
  try {
    deletingId.value = habit.id;
    await deleteHabit(habit.id);
    habits.value = habits.value.filter((h) => h.id !== habit.id);
    emit('notify', { text: 'Hábito eliminado', color: 'success' });
  } catch (error) {
    console.error('Error eliminando hábito:', error);
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo eliminar el hábito'),
      color: 'error',
    });
  } finally {
    deletingId.value = null;
  }
}

watch(
  () => props.clientId,
  () => {
    loadHabits();
  },
);

onMounted(() => {
  loadHabits();
});
</script>

<template>
  <v-card class="dhp" variant="flat">
    <v-card-title class="dhp__title text-body-1 font-weight-bold px-3 pt-3 pb-1">
      Hábitos Diarios
    </v-card-title>
    <v-card-subtitle class="dhp__hint px-3 pb-2">
      Checklist que verá el alumno cada día
    </v-card-subtitle>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-1" height="2" />

    <v-alert
      v-else-if="loadError"
      type="error"
      variant="tonal"
      density="compact"
      class="ma-3 mt-0"
    >
      {{ loadError }}
      <template #append>
        <v-btn variant="text" size="x-small" @click="loadHabits">Reintentar</v-btn>
      </template>
    </v-alert>

    <template v-else>
      <v-list v-if="habits.length > 0" density="compact" class="dhp__list py-0 px-1">
        <v-list-item
          v-for="habit in habits"
          :key="habit.id"
          class="dhp__item"
        >
          <v-list-item-title class="text-body-2">
            {{ habit.title }}
          </v-list-item-title>
          <template #append>
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="small"
              color="error"
              :loading="deletingId === habit.id"
              :disabled="saving"
              aria-label="Eliminar hábito"
              @click="onDelete(habit)"
            />
          </template>
        </v-list-item>
      </v-list>

      <p v-else class="dhp__empty px-3 py-2 mb-0">
        Sin hábitos aún. Añade el primero abajo.
      </p>

      <div class="dhp__add d-flex ga-2 align-start px-3 pb-3 pt-1">
        <v-text-field
          v-model="newTitle"
          label="Nuevo hábito"
          placeholder="Ej. Beber 2L de agua"
          density="compact"
          variant="outlined"
          hide-details="auto"
          color="primary"
          maxlength="255"
          :disabled="saving || loading"
          class="flex-grow-1"
          @keyup.enter="onAdd"
        />
        <v-btn
          color="primary"
          class="font-weight-bold"
          size="small"
          :loading="saving"
          :disabled="loading"
          @click="onAdd"
        >
          Añadir Hábito
        </v-btn>
      </div>
    </template>
  </v-card>
</template>

<style scoped>
.dhp {
  margin-top: 1rem;
  padding: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.dhp__title {
  line-height: 1.2;
}

.dhp__hint {
  opacity: 1;
  color: var(--tf-on-surface-muted, #a8b0bc) !important;
  font-size: 0.68rem;
}

.dhp__empty {
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.dhp__list {
  background: transparent;
}

.dhp__item {
  min-height: 40px;
}

.dhp__add {
  margin-top: 0.25rem;
}
</style>
