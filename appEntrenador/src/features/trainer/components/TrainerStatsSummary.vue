<script setup>
/**
 * KPIs compactos del Inicio trainer — densidad alta, una sola fila.
 */
import { computed } from 'vue';

const props = defineProps({
  clientsCount: { type: Number, default: 0 },
  sessionsThisMonth: { type: Number, default: 0 },
  retention: {
    type: Object,
    default: () => ({ active: 0, inactive: 0, ratePercent: 0, windowDays: 14 }),
  },
  pendingTasks: {
    type: Object,
    default: () => ({ unreviewedCheckins: 0, dietsUnassigned: 0, total: 0 }),
  },
  weekProgress: {
    type: Object,
    default: () => ({ sessionsCompleted: 0, vsPreviousPercent: 0 }),
  },
});

const emit = defineEmits(['openClients']);

const activeCount = computed(() => Number(props.retention?.active) || 0);
const inactiveCount = computed(() => Number(props.retention?.inactive) || 0);
const ratePercent = computed(() => Number(props.retention?.ratePercent) || 0);

const pendingTotal = computed(() => Number(props.pendingTasks?.total) || 0);
const pendingDetail = computed(() => {
  const c = Number(props.pendingTasks?.unreviewedCheckins) || 0;
  const d = Number(props.pendingTasks?.dietsUnassigned) || 0;
  return `${c} check-ins · ${d} nutrición`;
});

const weekSessions = computed(() => Number(props.weekProgress?.sessionsCompleted) || 0);
const weekDelta = computed(() => {
  const value = Number(props.weekProgress?.vsPreviousPercent) || 0;
  if (value > 0) return { label: `+${value}%`, up: true };
  if (value < 0) return { label: `${value}%`, up: false };
  return { label: null, up: null };
});
</script>

<template>
  <div class="kpi-row" role="list">
    <button
      type="button"
      class="kpi"
      role="listitem"
      title="Ver lista de alumnos"
      @click="emit('openClients')"
    >
      <div class="kpi__icon kpi__icon--cyan">
        <v-icon icon="mdi-account-group-outline" size="16" color="primary" />
      </div>
      <div class="kpi__body">
        <div class="kpi__value">{{ clientsCount }}</div>
        <div class="kpi__label">Alumnos</div>
      </div>
    </button>

    <div class="kpi" role="listitem">
      <div class="kpi__icon kpi__icon--green">
        <v-icon icon="mdi-account-heart-outline" size="16" color="#4CAF50" />
      </div>
      <div class="kpi__body">
        <div class="kpi__value">{{ activeCount }}</div>
        <div class="kpi__label">Activos</div>
        <div class="kpi__meta">{{ ratePercent }}% · {{ inactiveCount }} inact.</div>
      </div>
    </div>

    <button
      type="button"
      class="kpi"
      role="listitem"
      title="Revisar pendientes"
      @click="emit('openClients')"
    >
      <div class="kpi__icon kpi__icon--orange">
        <v-icon icon="mdi-clipboard-alert-outline" size="16" color="#FF9800" />
      </div>
      <div class="kpi__body">
        <div class="kpi__value">{{ pendingTotal }}</div>
        <div class="kpi__label">Pendientes</div>
        <div class="kpi__meta">{{ pendingDetail }}</div>
      </div>
    </button>

    <div class="kpi" role="listitem">
      <div class="kpi__icon kpi__icon--cyan">
        <v-icon icon="mdi-calendar-check-outline" size="16" color="primary" />
      </div>
      <div class="kpi__body">
        <div class="kpi__value-row">
          <span class="kpi__value">{{ weekSessions }}</span>
          <span
            v-if="weekDelta.label"
            class="kpi__badge"
            :class="weekDelta.up ? 'kpi__badge--up' : 'kpi__badge--down'"
          >{{ weekDelta.label }}</span>
        </div>
        <div class="kpi__label">Esta semana</div>
      </div>
    </div>

    <div class="kpi" role="listitem">
      <div class="kpi__icon kpi__icon--purple">
        <v-icon icon="mdi-dumbbell" size="16" color="#A855F7" />
      </div>
      <div class="kpi__body">
        <div class="kpi__value">{{ sessionsThisMonth }}</div>
        <div class="kpi__label">Este mes</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.kpi {
  background: #13161d;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 10px 12px;
  min-height: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  text-align: left;
  color: inherit;
  font: inherit;
  width: 100%;
  min-width: 0;
}

button.kpi {
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

button.kpi:hover {
  border-color: rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.04);
}

.kpi__icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi__icon--cyan { background: rgba(0, 229, 255, 0.1); }
.kpi__icon--green { background: rgba(76, 175, 80, 0.12); }
.kpi__icon--orange { background: rgba(255, 152, 0, 0.12); }
.kpi__icon--purple { background: rgba(168, 85, 247, 0.12); }

.kpi__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.kpi__value-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.kpi__value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
  color: #fff;
}

.kpi__label {
  font-size: 12px;
  font-weight: 600;
  color: #c8cdd6;
}

.kpi__meta {
  font-size: 10px;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi__badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 999px;
  white-space: nowrap;
}

.kpi__badge--up {
  background: rgba(76, 175, 80, 0.15);
  color: #81c784;
}

.kpi__badge--down {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

@media (max-width: 1100px) {
  .kpi-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .kpi-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .kpi {
    padding: 8px 10px;
  }

  .kpi__value {
    font-size: 18px;
  }
}
</style>
