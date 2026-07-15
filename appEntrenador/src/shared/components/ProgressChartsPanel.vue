<script setup>
/**
 * Panel de gráficas de progreso (métricas corporales + fuerza por ejercicio).
 * Usado en Mi Progreso (cliente) y ficha del alumno (trainer).
 */
import { computed, defineAsyncComponent, onMounted, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../api/http.js';
import { getProgressExercises, getProgressMetrics } from '../api/progressApi.js';

const ProgressLineChart = defineAsyncComponent(() => import('./ProgressLineChart.vue'));

const props = defineProps({
  clientId: {
    type: [Number, String],
    required: true,
  },
  /** Compacto para columna lateral de la ficha trainer */
  compact: {
    type: Boolean,
    default: false,
  },
});

const loadingMetrics = shallowRef(true);
const loadingExercises = shallowRef(false);
const loadingExerciseList = shallowRef(true);
const metricsError = shallowRef('');
const exercisesError = shallowRef('');
const exerciseListError = shallowRef('');

const metrics = shallowRef({ labels: [], weightKg: [], bmi: [] });
const exerciseOptions = shallowRef([]);
const selectedKey = shallowRef('');
const exerciseSeries = shallowRef({ exerciseName: '', labels: [], maxWeight: [] });

const selectedOption = computed(() => (
  exerciseOptions.value.find((o) => o.key === selectedKey.value) || null
));

const bodyDatasets = computed(() => [
  {
    label: 'Peso (kg)',
    data: metrics.value.weightKg,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    pointBackgroundColor: '#00E5FF',
  },
  {
    label: 'IMC',
    data: metrics.value.bmi,
    borderColor: '#00E676',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    pointBackgroundColor: '#00E676',
  },
]);

const strengthDatasets = computed(() => [
  {
    label: exerciseSeries.value.exerciseName
      ? `Máx. ${exerciseSeries.value.exerciseName} (kg)`
      : 'Peso máximo (kg)',
    data: exerciseSeries.value.maxWeight,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    pointBackgroundColor: '#00E5FF',
  },
]);

function optionKey(item) {
  if (item.exerciseId != null) {
    return `id:${item.exerciseId}`;
  }
  return `name:${item.exerciseName}`;
}

async function loadMetrics() {
  try {
    loadingMetrics.value = true;
    metricsError.value = '';
    const response = await getProgressMetrics(props.clientId);
    const data = response.data?.data ?? {};
    metrics.value = {
      labels: data.labels ?? [],
      weightKg: data.weightKg ?? [],
      bmi: data.bmi ?? [],
    };
  } catch (error) {
    console.error('Error cargando métricas de progreso:', error);
    metricsError.value = getApiErrorMessage(error, 'No se pudo cargar la evolución corporal');
    metrics.value = { labels: [], weightKg: [], bmi: [] };
  } finally {
    loadingMetrics.value = false;
  }
}

async function loadExerciseList() {
  try {
    loadingExerciseList.value = true;
    exerciseListError.value = '';
    const response = await getProgressExercises(props.clientId);
    const list = response.data?.data?.exercises ?? [];
    exerciseOptions.value = list.map((item) => ({
      ...item,
      key: optionKey(item),
      title: item.exerciseName,
    }));

    if (exerciseOptions.value.length > 0) {
      const stillValid = exerciseOptions.value.some((o) => o.key === selectedKey.value);
      if (!stillValid) {
        selectedKey.value = exerciseOptions.value[0].key;
      }
    } else {
      selectedKey.value = '';
      exerciseSeries.value = { exerciseName: '', labels: [], maxWeight: [] };
    }
  } catch (error) {
    console.error('Error cargando ejercicios con logs:', error);
    exerciseListError.value = getApiErrorMessage(error, 'No se pudo cargar la lista de ejercicios');
    exerciseOptions.value = [];
    selectedKey.value = '';
  } finally {
    loadingExerciseList.value = false;
  }
}

async function loadExerciseSeries() {
  const option = selectedOption.value;
  if (!option) {
    exerciseSeries.value = { exerciseName: '', labels: [], maxWeight: [] };
    return;
  }

  try {
    loadingExercises.value = true;
    exercisesError.value = '';
    const params = option.exerciseId != null
      ? { exerciseId: option.exerciseId }
      : { exerciseName: option.exerciseName };
    const response = await getProgressExercises(props.clientId, params);
    const data = response.data?.data ?? {};
    exerciseSeries.value = {
      exerciseName: data.exerciseName ?? option.exerciseName,
      labels: data.labels ?? [],
      maxWeight: data.maxWeight ?? [],
    };
  } catch (error) {
    console.error('Error cargando evolución de fuerza:', error);
    exercisesError.value = getApiErrorMessage(error, 'No se pudo cargar la evolución de fuerza');
    exerciseSeries.value = { exerciseName: '', labels: [], maxWeight: [] };
  } finally {
    loadingExercises.value = false;
  }
}

async function reloadAll() {
  await Promise.all([loadMetrics(), loadExerciseList()]);
}

watch(selectedKey, () => {
  loadExerciseSeries();
});

watch(() => props.clientId, () => {
  reloadAll();
});

onMounted(() => {
  reloadAll();
});

defineExpose({ reloadAll });
</script>

<template>
  <div class="progress-charts" :class="{ 'progress-charts--compact': compact }">
    <section class="progress-charts__block">
      <div class="progress-charts__head">
        <h3 class="progress-charts__title">Evolución corporal</h3>
        <span class="progress-charts__hint">Peso e IMC</span>
      </div>

      <v-progress-linear
        v-if="loadingMetrics"
        indeterminate
        color="primary"
        height="2"
        class="mb-3"
      />
      <v-alert
        v-else-if="metricsError"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-2"
      >
        {{ metricsError }}
        <template #append>
          <v-btn variant="text" size="x-small" @click="loadMetrics">Reintentar</v-btn>
        </template>
      </v-alert>
      <ProgressLineChart
        v-else
        :labels="metrics.labels"
        :datasets="bodyDatasets"
        empty-text="Registra al menos dos mediciones para visualizar tu gráfica de progreso"
      />
    </section>

    <section class="progress-charts__block">
      <div class="progress-charts__head">
        <h3 class="progress-charts__title">Evolución de fuerza</h3>
        <span class="progress-charts__hint">Máximo del día</span>
      </div>

      <v-select
        v-model="selectedKey"
        :items="exerciseOptions"
        item-title="title"
        item-value="key"
        label="Ejercicio"
        density="compact"
        variant="outlined"
        hide-details
        :loading="loadingExerciseList"
        :disabled="!exerciseOptions.length"
        :menu-props="{ contentClass: 'tf-overlay-menu' }"
        class="progress-charts__select mb-3"
      />

      <v-alert
        v-if="exerciseListError"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-2"
      >
        {{ exerciseListError }}
      </v-alert>
      <v-alert
        v-else-if="!loadingExerciseList && !exerciseOptions.length"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-2"
      >
        Completa entrenamientos con series registradas para ver la evolución de fuerza.
      </v-alert>
      <template v-else-if="selectedKey">
        <v-progress-linear
          v-if="loadingExercises"
          indeterminate
          color="primary"
          height="2"
          class="mb-3"
        />
        <v-alert
          v-else-if="exercisesError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-2"
        >
          {{ exercisesError }}
          <template #append>
            <v-btn variant="text" size="x-small" @click="loadExerciseSeries">Reintentar</v-btn>
          </template>
        </v-alert>
        <ProgressLineChart
          v-else
          :labels="exerciseSeries.labels"
          :datasets="strengthDatasets"
          empty-text="Registra al menos dos mediciones para visualizar tu gráfica de progreso"
        />
      </template>
    </section>
  </div>
</template>

<style scoped>
.progress-charts {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
}

.progress-charts__block {
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  min-width: 0;
}

.progress-charts--compact .progress-charts__block {
  padding: 0.75rem 0.8rem;
}

.progress-charts__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.25rem 0.75rem;
  margin-bottom: 0.65rem;
}

.progress-charts__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
  color: #fff;
}

.progress-charts__hint {
  font-size: 0.68rem;
  color: #8b929e;
}

.progress-charts__select {
  max-width: 100%;
}
</style>
