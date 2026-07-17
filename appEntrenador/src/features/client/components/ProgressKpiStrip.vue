<script setup>
defineProps({
  totalSessions: { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  sessionsLast7Days: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
});
</script>

<template>
  <div class="kpi-strip" aria-label="Resumen de progreso">
    <v-card class="kpi-card" variant="flat">
      <p class="kpi-card__label">Sesiones</p>
      <p class="kpi-card__value">{{ loading ? '—' : totalSessions }}</p>
      <p class="kpi-card__hint">{{ loading ? '…' : `${completedCount} hechas` }}</p>
    </v-card>

    <v-card class="kpi-card" variant="flat">
      <p class="kpi-card__label">Racha</p>
      <p class="kpi-card__value kpi-card__value--accent">
        {{ loading ? '—' : currentStreak }}
      </p>
      <p class="kpi-card__hint">días seguidos</p>
    </v-card>

    <v-card class="kpi-card" variant="flat">
      <p class="kpi-card__label">Esta semana</p>
      <p class="kpi-card__value">{{ loading ? '—' : sessionsLast7Days }}</p>
      <p class="kpi-card__hint">últimos 7 días</p>
    </v-card>
  </div>
</template>

<style scoped>
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.kpi-card {
  padding: 10px 8px;
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.kpi-card__label {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b929e;
}

.kpi-card__value {
  margin: 4px 0 0;
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.kpi-card__value--accent {
  color: rgb(var(--v-theme-primary));
}

.kpi-card__hint {
  margin: 4px 0 0;
  font-size: 0.62rem;
  color: #8b929e;
}
</style>
