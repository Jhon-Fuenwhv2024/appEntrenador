<script setup>
/**
 * Línea Chart.js reutilizable (tema dark Trainfit).
 * Oculta el canvas si hay menos de 2 puntos (no se puede trazar línea).
 */
import { computed } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },
  datasets: {
    type: Array,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: 'Registra al menos dos mediciones para visualizar tu gráfica de progreso',
  },
});

const canChart = computed(() => {
  if (!Array.isArray(props.labels) || props.labels.length < 2) {
    return false;
  }
  return props.datasets.some((ds) => {
    const values = Array.isArray(ds?.data) ? ds.data : [];
    const numeric = values.filter((v) => v != null && Number.isFinite(Number(v)));
    return numeric.length >= 2;
  });
});

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((ds) => ({
    tension: 0.3,
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 5,
    fill: false,
    ...ds,
  })),
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      labels: {
        color: '#C5CAD3',
        boxWidth: 12,
        font: { size: 11 },
      },
    },
    tooltip: {
      backgroundColor: '#1E1E1E',
      titleColor: '#FFFFFF',
      bodyColor: '#C5CAD3',
      borderColor: 'rgba(0, 229, 255, 0.35)',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: {
        color: 'var(--tf-on-surface-muted, #a8b0bc)',
        maxRotation: 45,
        minRotation: 0,
        font: { size: 10 },
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.06)',
      },
      border: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
    },
    y: {
      ticks: {
        color: 'var(--tf-on-surface-muted, #a8b0bc)',
        font: { size: 10 },
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.06)',
      },
      border: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
      beginAtZero: false,
    },
  },
};
</script>

<template>
  <div class="progress-line-chart">
    <v-alert
      v-if="!canChart"
      type="info"
      variant="tonal"
      density="compact"
      class="progress-line-chart__empty"
    >
      {{ emptyText }}
    </v-alert>
    <div v-else class="progress-line-chart__canvas-wrap">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.progress-line-chart {
  width: 100%;
  min-width: 0;
}

.progress-line-chart__canvas-wrap {
  position: relative;
  width: 100%;
  height: 300px;
}

.progress-line-chart__empty {
  margin: 0;
}
</style>
