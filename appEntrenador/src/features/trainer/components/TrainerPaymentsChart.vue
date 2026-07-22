<script setup>
/**
 * Barras horizontales: estado de pagos/membresías de alumnos (Feature 040).
 */
import { computed } from 'vue';

const props = defineProps({
  payments: {
    type: Object,
    default: () => ({
      active: 0,
      owing: 0,
      expired: 0,
      none: 0,
      expiringSoon: 0,
    }),
  },
});

const rows = computed(() => {
  const p = props.payments || {};
  return [
    { key: 'active', label: 'Al día', count: Number(p.active) || 0, color: '#4CAF50' },
    { key: 'expiring', label: 'Por vencer', count: Number(p.expiringSoon) || 0, color: '#FF9800' },
    { key: 'owing', label: 'Debe', count: Number(p.owing) || 0, color: '#F59E0B' },
    { key: 'expired', label: 'Vencido', count: Number(p.expired) || 0, color: '#F87171' },
    { key: 'none', label: 'Sin plan', count: Number(p.none) || 0, color: '#6D7480' },
  ];
});

const maxCount = computed(() => {
  const max = Math.max(0, ...rows.value.map((r) => r.count));
  return max > 0 ? max : 1;
});

const totalTracked = computed(() => rows.value
  .filter((r) => r.key !== 'expiring')
  .reduce((sum, r) => sum + r.count, 0));

const hasData = computed(() => totalTracked.value > 0);
</script>

<template>
  <div class="chart-card payments-chart">
    <div class="chart-header">
      <div>
        <h3 class="section-title">Pagos de alumnos</h3>
        <p class="section-subtitle">
          {{ totalTracked }} alumnos · estado de membresía
        </p>
      </div>
    </div>

    <div v-if="!hasData" class="chart-empty">
      Sin alumnos todavía.
    </div>

    <ul v-else class="pay-bars" aria-label="Estados de pago">
      <li v-for="row in rows" :key="row.key" class="pay-bars__row">
        <span class="pay-bars__label">{{ row.label }}</span>
        <div class="pay-bars__track" aria-hidden="true">
          <div
            class="pay-bars__fill"
            :style="{
              width: `${(row.count / maxCount) * 100}%`,
              background: row.color,
            }"
          />
        </div>
        <span class="pay-bars__count">{{ row.count }}</span>
      </li>
    </ul>
  </div>
</template>

<style src="../../../assets/trainerDashboard.css" scoped></style>

<style scoped>
.payments-chart {
  overflow: hidden;
  min-width: 0;
  padding: 14px 16px 12px;
  min-height: 0;
}

.payments-chart :deep(.chart-header) {
  margin-bottom: 10px;
}

.payments-chart :deep(.section-title) {
  font-size: 14px;
}

.chart-empty {
  padding: 12px 4px;
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-size: 13px;
}

.pay-bars {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pay-bars__row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 8px;
}

.pay-bars__label {
  font-size: 11px;
  color: #c8cdd6;
  font-weight: 600;
  white-space: nowrap;
}

.pay-bars__track {
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.pay-bars__fill {
  height: 100%;
  border-radius: 999px;
  min-width: 0;
  transition: width 0.25s ease;
}

.pay-bars__count {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  text-align: right;
}
</style>
