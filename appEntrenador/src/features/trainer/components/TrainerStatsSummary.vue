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

const emit = defineEmits(['openClients']);

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
    <button
      type="button"
      class="stat-card stat-card--action"
      title="Ver lista de alumnos"
      @click="emit('openClients')"
    >
      <div class="stat-icon stat-icon-cyan">
        <v-icon icon="mdi-account-group-outline" size="18" color="primary"></v-icon>
      </div>
      <div class="stat-value">{{ clientsCount }}</div>
      <div class="stat-label">Total Alumnos</div>
      <span class="stat-card__hint">Ver lista</span>
    </button>

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
.stat-card--action {
  cursor: pointer;
  font: inherit;
  text-align: left;
  width: 100%;
  position: relative;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.stat-card--action:hover {
  border-color: rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.04);
}

.stat-card__hint {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #00E5FF;
  letter-spacing: 0.01em;
}

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

  .stat-card__hint {
    margin-top: 4px;
    font-size: 10px;
  }
}
</style>
