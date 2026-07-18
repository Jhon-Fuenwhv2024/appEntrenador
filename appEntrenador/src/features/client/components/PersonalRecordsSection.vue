<script setup>
import { onMounted, shallowRef } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getMyPersonalRecords } from '../api/personalRecordsApi.js';

const loading = shallowRef(true);
const loadError = shallowRef('');
const records = shallowRef([]);

function formatDate(raw) {
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(raw).slice(0, 10);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function load() {
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getMyPersonalRecords();
    records.value = response.data?.data ?? [];
  } catch (error) {
    console.error('Error cargando récords personales:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudieron cargar tus récords');
    records.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="pr-section" aria-label="Mis récords">
    <div class="pr-section__head">
      <h2 class="pr-section__title">
        <v-icon icon="mdi-trophy-outline" size="18" class="mr-1" />
        Mis récords
      </h2>
      <span class="pr-section__hint">Máximos de peso por ejercicio</span>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" height="2" class="mb-2" />

    <v-alert
      v-else-if="loadError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-0"
    >
      {{ loadError }}
      <template #append>
        <v-btn variant="text" size="x-small" @click="load">Reintentar</v-btn>
      </template>
    </v-alert>

    <p v-else-if="records.length === 0" class="pr-section__empty">
      Aún no tienes PRs. Supera tu máximo de peso en un ejercicio al terminar un entreno.
    </p>

    <ul v-else class="pr-section__list">
      <li v-for="pr in records" :key="pr.id" class="pr-section__item">
        <div class="pr-section__main">
          <span class="pr-section__name">{{ pr.exercise_name }}</span>
          <span class="pr-section__date">{{ formatDate(pr.achieved_at) }}</span>
        </div>
        <span class="pr-section__stats">{{ pr.weight }} kg × {{ pr.reps }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.pr-section {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.pr-section__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 0.65rem;
}

.pr-section__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  display: flex;
  align-items: center;
}

.pr-section__hint {
  font-size: 0.7rem;
  color: #8b929e;
}

.pr-section__empty {
  margin: 0;
  font-size: 0.8rem;
  color: #8b929e;
}

.pr-section__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.pr-section__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
}

.pr-section__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pr-section__name {
  font-weight: 700;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pr-section__date {
  font-size: 0.65rem;
  color: #8b929e;
}

.pr-section__stats {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.8rem;
  color: rgb(var(--v-theme-primary));
  font-variant-numeric: tabular-nums;
}
</style>
