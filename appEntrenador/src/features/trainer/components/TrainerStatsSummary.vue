<script setup>
import { computed } from 'vue';

const props = defineProps({
  clientsCount: {
    type: Number,
    default: 0,
  },
  routinesCount: {
    type: Number,
    default: 0,
  },
  sessionsThisMonth: {
    type: Number,
    default: 0,
  },
  growthPercent: {
    type: Number,
    default: 0,
  },
});

const growthLabel = computed(() => {
  const value = Number(props.growthPercent) || 0;
  if (value > 0) return `+${value}%`;
  if (value < 0) return `${value}%`;
  return '0%';
});

const growthPositive = computed(() => (Number(props.growthPercent) || 0) >= 0);
</script>

<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon stat-icon-cyan">
        <v-icon icon="mdi-account-group-outline" size="18" color="primary"></v-icon>
      </div>
      <div class="stat-value">{{ clientsCount }}</div>
      <div class="stat-label">Total Alumnos</div>
    </div>

    <div class="stat-card">
      <div class="stat-icon stat-icon-green">
        <v-icon icon="mdi-clipboard-text-outline" size="18" color="#4CAF50"></v-icon>
      </div>
      <div class="stat-value">{{ routinesCount }}</div>
      <div class="stat-label">Rutinas Activas</div>
    </div>

    <div class="stat-card">
      <div class="stat-icon stat-icon-orange">
        <v-icon icon="mdi-dumbbell" size="18" color="#FF9800"></v-icon>
      </div>
      <div class="stat-value">{{ sessionsThisMonth }}</div>
      <div class="stat-label">Sesiones (mes)</div>
    </div>

    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-icon stat-icon-purple">
          <v-icon icon="mdi-trending-up" size="18" color="#A855F7"></v-icon>
        </div>
        <span class="growth-badge" :class="{ 'growth-badge--down': !growthPositive }">
          {{ growthLabel }}
        </span>
      </div>
      <div class="stat-value">{{ growthLabel }}</div>
      <div class="stat-label">Crecimiento alumnos</div>
    </div>
  </div>
</template>

<style src="../../../assets/trainerDashboard.css" scoped></style>

<style scoped>
.growth-badge--down {
  background: rgba(239, 68, 68, 0.15);
  color: #F87171;
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 4px;
  }

  .stat-card {
    min-height: 0;
    padding: 12px;
    border-radius: 14px;
  }

  .stat-icon {
    width: 32px;
    height: 32px;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 22px;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-card-top {
    margin-bottom: 8px;
  }
}
</style>
