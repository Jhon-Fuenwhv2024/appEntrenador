<script setup>
/**
 * Barras Chart.js (tema dark Trainfit) para actividad semanal/mensual.
 */
import { computed } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },
  values: {
    type: Array,
    default: () => [],
  },
  datasetLabel: {
    type: String,
    default: 'Sesiones',
  },
  emptyText: {
    type: String,
    default: 'Aún no hay sesiones para graficar.',
  },
});

const hasData = computed(() => (
  props.values.some((v) => Number(v) > 0)
));

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.datasetLabel,
      data: props.values,
      backgroundColor: 'rgba(0, 229, 255, 0.55)',
      hoverBackgroundColor: '#00E5FF',
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 28,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#13161D',
      titleColor: '#fff',
      bodyColor: '#C5CAD3',
      borderColor: 'rgba(0, 229, 255, 0.35)',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#8B929E',
        font: { size: 10 },
        maxRotation: 0,
      },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#8B929E',
        font: { size: 10 },
        precision: 0,
        stepSize: 1,
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.06)',
      },
    },
  },
};
</script>

<template>
  <div class="bar-chart">
    <div v-if="!hasData" class="bar-chart__empty">
      {{ emptyText }}
    </div>
    <div v-else class="bar-chart__canvas">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.bar-chart__canvas {
  height: 180px;
  width: 100%;
}

.bar-chart__empty {
  padding: 1.25rem 0.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: #8b929e;
}
</style>
