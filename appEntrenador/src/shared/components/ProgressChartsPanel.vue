<script setup>
/**
 * Panel de gráficas de progreso (actividad + métricas corporales + fuerza).
 * Usado en Mi Progreso (cliente) y ficha del alumno (trainer).
 * Feature 072: filtro opcional 7/30/90 + contexto de tendencia.
 */
import { computed, defineAsyncComponent, onMounted, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../api/http.js';
import { getProgressExercises, getProgressMetrics } from '../api/progressApi.js';
import { useProgressSessions } from '../../features/client/composables/useProgressSessions.js';
import {
  PROGRESS_RANGE_OPTIONS,
  computeSeriesTrend,
  filterAlignedSeriesByRange,
  weeksForRange,
} from '../../features/client/composables/useProgressRange.js';

const ProgressLineChart = defineAsyncComponent(() => import('./ProgressLineChart.vue'));
const ProgressBarChart = defineAsyncComponent(() => import('./ProgressBarChart.vue'));

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
  /** Sesiones del cliente para gráfica de actividad (opcional). */
  sessions: {
    type: Array,
    default: () => [],
  },
  /**
   * Días de rango. `null` = sin filtro (todas las series).
   * Con `enableRangeFilter` el panel gestiona chips 7/30/90.
   */
  rangeDays: {
    type: Number,
    default: null,
  },
  /** Muestra chips 7/30/90 (cliente). Trainer: false por defecto. */
  enableRangeFilter: {
    type: Boolean,
    default: false,
  },
  /** Oculta bloque de actividad si el padre ya muestra ProgressActivityBars. */
  hideActivity: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:rangeDays']);

const internalRange = shallowRef(props.enableRangeFilter ? (props.rangeDays || 30) : props.rangeDays);

watch(() => props.rangeDays, (value) => {
  if (props.enableRangeFilter) {
    if (value === 7 || value === 30 || value === 90) {
      internalRange.value = value;
    }
  } else {
    internalRange.value = value;
  }
});

const effectiveRangeDays = computed(() => {
  if (props.enableRangeFilter) {
    return internalRange.value || 30;
  }
  return props.rangeDays;
});

function selectRange(days) {
  if (!props.enableRangeFilter) return;
  internalRange.value = days;
  emit('update:rangeDays', days);
}

const activityPeriod = shallowRef('week');
const {
  weeklyActivity,
  monthlyActivity,
  buildWeeklyActivity,
  completedCount,
  allSessionsByMonth,
} = useProgressSessions(computed(() => props.sessions));

const rangedWeeklyActivity = computed(() => {
  if (!props.enableRangeFilter) return weeklyActivity.value;
  return buildWeeklyActivity(weeksForRange(effectiveRangeDays.value));
});

const activityLabels = computed(() => (
  activityPeriod.value === 'week'
    ? rangedWeeklyActivity.value.map((w) => w.label)
    : monthlyActivity.value.map((m) => m.label)
));

const activityValues = computed(() => (
  activityPeriod.value === 'week'
    ? rangedWeeklyActivity.value.map((w) => w.count)
    : monthlyActivity.value.map((m) => m.count)
));

const activityHint = computed(() => {
  if (activityPeriod.value === 'month') {
    return 'Sesiones completadas por mes';
  }
  if (props.enableRangeFilter) {
    return `Sesiones completadas · ${weeksForRange(effectiveRangeDays.value)} semanas`;
  }
  return 'Sesiones completadas por semana';
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

const filteredBody = computed(() => {
  const filtered = filterAlignedSeriesByRange(
    metrics.value.labels,
    [metrics.value.weightKg, metrics.value.bmi],
    effectiveRangeDays.value,
  );
  return {
    labels: filtered.labels,
    weightKg: filtered.seriesList[0] ?? [],
    bmi: filtered.seriesList[1] ?? [],
  };
});

const filteredStrength = computed(() => {
  const filtered = filterAlignedSeriesByRange(
    exerciseSeries.value.labels,
    [exerciseSeries.value.maxWeight],
    effectiveRangeDays.value,
  );
  return {
    labels: filtered.labels,
    maxWeight: filtered.seriesList[0] ?? [],
  };
});

const bodyTrend = computed(() => computeSeriesTrend(filteredBody.value.weightKg));
const strengthTrend = computed(() => computeSeriesTrend(filteredStrength.value.maxWeight));

const bodyDatasets = computed(() => [
  {
    label: 'Peso (kg)',
    data: filteredBody.value.weightKg,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    pointBackgroundColor: '#00E5FF',
  },
  {
    label: 'IMC',
    data: filteredBody.value.bmi,
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
    data: filteredStrength.value.maxWeight,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    pointBackgroundColor: '#00E5FF',
  },
]);

function trendIcon(direction) {
  if (direction === 'up') return 'mdi-trending-up';
  if (direction === 'down') return 'mdi-trending-down';
  return 'mdi-approximately-equal';
}

function formatTrendDelta(delta, unit) {
  if (delta == null) return '';
  const rounded = Math.round(delta * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded} ${unit}`;
}

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
    <div
      v-if="enableRangeFilter"
      class="progress-charts__range"
      role="group"
      aria-label="Rango de tendencias"
    >
      <button
        v-for="opt in PROGRESS_RANGE_OPTIONS"
        :key="opt.value"
        type="button"
        class="progress-charts__range-chip"
        :class="{ 'progress-charts__range-chip--active': effectiveRangeDays === opt.value }"
        :aria-pressed="effectiveRangeDays === opt.value"
        :aria-label="`Tendencias últimos ${opt.label}`"
        @click="selectRange(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <section
      v-if="!hideActivity && (sessions.length || completedCount)"
      class="progress-charts__block"
    >
      <div class="progress-charts__head">
        <div>
          <h3 class="progress-charts__title">Actividad de entrenamiento</h3>
          <span class="progress-charts__hint">{{ activityHint }}</span>
        </div>
        <v-btn-toggle
          v-model="activityPeriod"
          density="compact"
          color="primary"
          variant="outlined"
          divided
          mandatory
          class="progress-charts__toggle"
        >
          <v-btn value="week" size="small">Semana</v-btn>
          <v-btn value="month" size="small">Mes</v-btn>
        </v-btn-toggle>
      </div>

      <ProgressBarChart
        :labels="activityLabels"
        :values="activityValues"
        :dataset-label="activityPeriod === 'week' ? 'Sesiones / semana' : 'Sesiones / mes'"
        empty-text="Completa entrenamientos para ver tu actividad aquí."
      />

      <div v-if="allSessionsByMonth.length" class="progress-charts__months">
        <span
          v-for="month in allSessionsByMonth.slice(0, 6)"
          :key="month.key"
          class="progress-charts__month-chip"
        >
          {{ month.label.split(' ')[0] }}
          <strong>{{ month.count }}</strong>
        </span>
      </div>
    </section>

    <section class="progress-charts__block">
      <div class="progress-charts__head">
        <div>
          <h3 class="progress-charts__title">Evolución corporal</h3>
          <span class="progress-charts__hint">Peso e IMC</span>
        </div>
        <span
          v-if="bodyTrend"
          class="progress-charts__trend"
          :class="`progress-charts__trend--${bodyTrend.direction}`"
        >
          <v-icon :icon="trendIcon(bodyTrend.direction)" size="14" aria-hidden="true" />
          {{ bodyTrend.label }}
          <span class="progress-charts__trend-delta">
            {{ formatTrendDelta(bodyTrend.delta, 'kg') }}
          </span>
        </span>
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
        :labels="filteredBody.labels"
        :datasets="bodyDatasets"
        empty-text="Entrena y registra peso para ver tu evolución"
      />
    </section>

    <section class="progress-charts__block">
      <div class="progress-charts__head">
        <div>
          <h3 class="progress-charts__title">Evolución de fuerza</h3>
          <span class="progress-charts__hint">Máximo del día</span>
        </div>
        <span
          v-if="strengthTrend"
          class="progress-charts__trend"
          :class="`progress-charts__trend--${strengthTrend.direction}`"
        >
          <v-icon :icon="trendIcon(strengthTrend.direction)" size="14" aria-hidden="true" />
          {{ strengthTrend.label }}
          <span class="progress-charts__trend-delta">
            {{ formatTrendDelta(strengthTrend.delta, 'kg') }}
          </span>
        </span>
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
          :labels="filteredStrength.labels"
          :datasets="strengthDatasets"
          empty-text="Entrena y registra peso para ver tu evolución"
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

.progress-charts__range {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.progress-charts__range-chip {
  min-height: 44px;
  min-width: 72px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: var(--tf-on-surface, #fff);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.progress-charts__range-chip:hover {
  background: rgba(0, 229, 255, 0.1);
  border-color: rgba(0, 229, 255, 0.35);
}

.progress-charts__range-chip:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.progress-charts__range-chip--active {
  background: rgba(0, 229, 255, 0.16);
  border-color: rgba(0, 229, 255, 0.55);
  color: rgb(var(--v-theme-primary));
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.65rem;
}

.progress-charts__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--tf-on-surface, #fff);
}

.progress-charts__hint {
  display: block;
  margin-top: 2px;
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.progress-charts__trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--tf-on-surface, #fff);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.progress-charts__trend--up {
  color: #00e676;
}

.progress-charts__trend--down {
  color: #ffab40;
}

.progress-charts__trend--stable {
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.progress-charts__trend-delta {
  font-weight: 600;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.progress-charts__toggle {
  flex-shrink: 0;
}

.progress-charts__months {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.progress-charts__month-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.progress-charts__month-chip strong {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.progress-charts__select {
  max-width: 100%;
}
</style>
