<script setup>
/**
 * Actividad mensual compacta (alumnos acumulados + sesiones del mes).
 */
import { computed } from 'vue';

const props = defineProps({
  months: {
    type: Array,
    default: () => [],
  },
});

const WIDTH = 600;
const HEIGHT = 120;
const PAD_TOP = 6;
const PAD_BOTTOM = 6;

const series = computed(() => {
  const rows = Array.isArray(props.months) ? props.months : [];
  if (!rows.length) return [];
  let start = 0;
  while (
    start < rows.length - 3
    && (Number(rows[start].clients) || 0) === 0
    && (Number(rows[start].sessions) || 0) === 0
  ) {
    start += 1;
  }
  return rows.slice(start);
});

const chartMax = computed(() => {
  const values = series.value.flatMap((m) => [Number(m.clients) || 0, Number(m.sessions) || 0]);
  const max = Math.max(0, ...values);
  if (max <= 0) return 4;
  return Math.ceil(max / 4) * 4;
});

const yTicks = computed(() => {
  const max = chartMax.value;
  return [max, Math.round(max / 2), 0];
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
  const points = series.value.map((month, index) => {
    const x = pointX(index, series.value.length);
    const y = pointY(month[key]);
    return `${x},${y}`;
  });
  if (points.length === 0) return '';
  return `M${points.join(' L')}`;
}

const clientsPath = computed(() => buildPath('clients'));
const sessionsPath = computed(() => buildPath('sessions'));

const clientsAreaPath = computed(() => {
  if (!series.value.length) return '';
  const line = buildPath('clients');
  const lastX = pointX(series.value.length - 1, series.value.length);
  const firstX = pointX(0, series.value.length);
  return `${line} L${lastX},${HEIGHT - PAD_BOTTOM} L${firstX},${HEIGHT - PAD_BOTTOM} Z`;
});

const hasData = computed(() => series.value.some(
  (m) => (Number(m.clients) || 0) > 0 || (Number(m.sessions) || 0) > 0,
));

const clientPoints = computed(() => series.value.map((m, i) => ({
  x: pointX(i, series.value.length),
  y: pointY(m.clients),
  key: `c-${m.month}`,
})));

const sessionPoints = computed(() => series.value.map((m, i) => ({
  x: pointX(i, series.value.length),
  y: pointY(m.sessions),
  key: `s-${m.month}`,
})));
</script>

<template>
  <div class="chart-card chart-card--monthly">
    <div class="chart-header">
      <div>
        <h3 class="section-title">Actividad mensual</h3>
        <p class="section-subtitle">Alumnos acumulados y sesiones completadas</p>
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="dot bg-cyan"></span>Alumnos</span>
        <span class="legend-item"><span class="dot bg-green"></span>Sesiones</span>
      </div>
    </div>

    <div v-if="!series.length || !hasData" class="chart-empty">
      Sin datos suficientes todavía.
    </div>

    <div v-else class="chart-plot">
      <div class="y-axis" aria-hidden="true">
        <span v-for="tick in yTicks" :key="tick">{{ tick }}</span>
      </div>
      <div class="chart-svg-wrap">
        <svg
          :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
          preserveAspectRatio="none"
          class="chart-svg"
          role="img"
          aria-label="Gráfico de actividad mensual"
        >
          <defs>
            <linearGradient id="tf-monthly-cyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#00E5FF" stop-opacity="0" />
            </linearGradient>
            <clipPath id="tf-monthly-clip">
              <rect x="0" y="0" :width="WIDTH" :height="HEIGHT" />
            </clipPath>
          </defs>
          <g clip-path="url(#tf-monthly-clip)">
            <line
              v-for="tick in yTicks"
              :key="`grid-${tick}`"
              x1="0"
              :y1="pointY(tick)"
              :x2="WIDTH"
              :y2="pointY(tick)"
              stroke="rgba(255,255,255,0.06)"
              stroke-width="1"
              vector-effect="non-scaling-stroke"
            />
            <path v-if="clientsAreaPath" :d="clientsAreaPath" fill="url(#tf-monthly-cyan)" />
            <path
              v-if="sessionsPath"
              :d="sessionsPath"
              fill="none"
              stroke="#4CAF50"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
            />
            <path
              v-if="clientsPath"
              :d="clientsPath"
              fill="none"
              stroke="#00E5FF"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
            />
            <circle
              v-for="p in clientPoints"
              :key="p.key"
              :cx="p.x"
              :cy="p.y"
              r="3"
              fill="#00E5FF"
            />
            <circle
              v-for="p in sessionPoints"
              :key="p.key"
              :cx="p.x"
              :cy="p.y"
              r="3"
              fill="#4CAF50"
            />
          </g>
        </svg>
      </div>
    </div>

    <div v-if="series.length && hasData" class="chart-x-axis">
      <span v-for="month in series" :key="month.month">{{ month.label }}</span>
    </div>
  </div>
</template>

<style src="../../../assets/trainerDashboard.css" scoped></style>

<style scoped>
.chart-card--monthly {
  overflow: hidden;
  min-width: 0;
  padding: 14px 16px 12px;
  min-height: 0;
}

.chart-card--monthly :deep(.chart-header) {
  margin-bottom: 10px;
}

.chart-card--monthly :deep(.section-title) {
  font-size: 14px;
}

.chart-empty {
  padding: 12px 4px;
  color: #8b929e;
  font-size: 13px;
}

.chart-plot {
  position: relative;
  padding-left: 28px;
  overflow: hidden;
}

.chart-svg-wrap {
  width: 100%;
  height: 120px;
  overflow: hidden;
  border-radius: 6px;
}

.chart-svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.y-axis {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #6d7480;
  font-size: 10px;
  line-height: 1;
  pointer-events: none;
}

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  padding-left: 28px;
  color: #8b929e;
  font-size: 10px;
}
</style>
