<script setup>
import { computed } from 'vue';

const props = defineProps({
  months: {
    type: Array,
    default: () => [],
  },
});

const WIDTH = 620;
const HEIGHT = 220;
const PAD_TOP = 16;
const PAD_BOTTOM = 16;

const chartMax = computed(() => {
  const values = props.months.flatMap((m) => [Number(m.clients) || 0, Number(m.sessions) || 0]);
  const max = Math.max(0, ...values);
  if (max <= 0) return 4;
  return Math.ceil(max / 4) * 4;
});

const yTicks = computed(() => {
  const max = chartMax.value;
  return [max, Math.round((max * 3) / 4), Math.round(max / 2), Math.round(max / 4)];
});

function pointX(index, total) {
  if (total <= 1) return WIDTH / 2;
  return (index / (total - 1)) * WIDTH;
}

function pointY(value) {
  const max = chartMax.value || 1;
  const usable = HEIGHT - PAD_TOP - PAD_BOTTOM;
  return PAD_TOP + usable * (1 - (Number(value) || 0) / max);
}

function buildPath(key) {
  const points = props.months.map((month, index) => {
    const x = pointX(index, props.months.length);
    const y = pointY(month[key]);
    return `${x},${y}`;
  });
  if (points.length === 0) return '';
  return `M${points.join(' L')}`;
}

const clientsPath = computed(() => buildPath('clients'));
const sessionsPath = computed(() => buildPath('sessions'));

const clientsAreaPath = computed(() => {
  if (!props.months.length) return '';
  const line = buildPath('clients');
  const lastX = pointX(props.months.length - 1, props.months.length);
  const firstX = pointX(0, props.months.length);
  return `${line} L${lastX},${HEIGHT} L${firstX},${HEIGHT} Z`;
});

const hasData = computed(() => props.months.some(
  (m) => (Number(m.clients) || 0) > 0 || (Number(m.sessions) || 0) > 0,
));
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <div>
        <h3 class="section-title">Actividad Mensual</h3>
        <p class="section-subtitle">Alumnos acumulados y sesiones completadas</p>
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="dot bg-cyan"></span>Alumnos</span>
        <span class="legend-item"><span class="dot bg-green"></span>Sesiones</span>
      </div>
    </div>

    <div v-if="!months.length" class="chart-empty">
      Sin datos suficientes todavía.
    </div>

    <div v-else class="chart-container">
      <div class="y-axis">
        <span v-for="tick in yTicks" :key="tick">{{ tick }}</span>
      </div>
      <svg
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        preserveAspectRatio="none"
        class="chart-svg"
        role="img"
        aria-label="Gráfico de actividad mensual"
      >
        <defs>
          <linearGradient id="cyan-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#00E5FF" stop-opacity="0" />
          </linearGradient>
        </defs>
        <line
          v-for="(tick, index) in yTicks"
          :key="`grid-${tick}`"
          x1="0"
          :y1="pointY(tick)"
          :x2="WIDTH"
          :y2="pointY(tick)"
          stroke="rgba(255,255,255,0.04)"
          stroke-width="1"
        />
        <path
          v-if="hasData && clientsAreaPath"
          :d="clientsAreaPath"
          fill="url(#cyan-gradient)"
        />
        <path
          v-if="sessionsPath"
          :d="sessionsPath"
          fill="none"
          stroke="#4CAF50"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          v-if="clientsPath"
          :d="clientsPath"
          fill="none"
          stroke="#00E5FF"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <div v-if="months.length" class="chart-x-axis">
      <span v-for="month in months" :key="month.month">{{ month.label }}</span>
    </div>
  </div>
</template>

<style src="../../../assets/trainerDashboard.css" scoped></style>

<style scoped>
.chart-empty {
  padding: 28px 8px 12px;
  color: #8B929E;
  font-size: 14px;
}

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  margin-top: 8px;
  padding: 0 4px 0 28px;
  color: #8B929E;
  font-size: 11px;
}
</style>
