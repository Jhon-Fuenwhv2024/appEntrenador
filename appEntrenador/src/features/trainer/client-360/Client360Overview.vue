<script setup>
/**
 * Resumen widgets: last session, last check-in, nutrition snapshot,
 * quick actions, session history, and null-safe PR slot (041).
 */
import { computed } from 'vue';
import WorkoutSessionHistoryList from '../../../shared/components/WorkoutSessionHistoryList.vue';

const props = defineProps({
  overview: {
    type: Object,
    default: null,
  },
  sessions: {
    type: Array,
    default: () => [],
  },
  clientName: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['go-tab']);

const lastSession = computed(() => props.overview?.lastSession || null);
const lastCheckin = computed(() => props.overview?.lastCheckin || null);
const nutrition = computed(() => props.overview?.nutritionTargets || null);
const counts = computed(() => props.overview?.counts || {
  routines: 0,
  sessions: 0,
  checkins: 0,
});
const prsThisMonth = computed(() => props.overview?.prsThisMonth ?? null);

const lastSessionTitle = computed(() => {
  if (!lastSession.value) return 'Sin sesiones aún';
  return lastSession.value.routine_name || 'Última sesión';
});

const lastSessionDate = computed(() => {
  const raw = lastSession.value?.finished_at
    || lastSession.value?.started_at
    || lastSession.value?.created_at;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const lastCheckinDate = computed(() => {
  const raw = lastCheckin.value?.created_at;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(raw).slice(0, 10);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
});

const prsLabel = computed(() => {
  const prs = prsThisMonth.value;
  if (prs == null) return null;
  if (Array.isArray(prs)) return `${prs.length} PRs este mes`;
  if (typeof prs === 'number') return `${prs} PRs este mes`;
  if (typeof prs === 'object' && prs.count != null) return `${prs.count} PRs este mes`;
  return null;
});
</script>

<template>
  <div class="c360-overview">
    <div class="c360-overview__grid">
      <button
        type="button"
        class="c360-widget"
        @click="emit('go-tab', 'programacion')"
      >
        <span class="c360-widget__label">Última sesión</span>
        <span class="c360-widget__title">{{ lastSessionTitle }}</span>
        <span v-if="lastSessionDate" class="c360-widget__meta">{{ lastSessionDate }}</span>
        <span class="c360-widget__meta">{{ counts.sessions }} registradas</span>
      </button>

      <button
        type="button"
        class="c360-widget"
        @click="emit('go-tab', 'checkins')"
      >
        <span class="c360-widget__label">Check-in reciente</span>
        <span class="c360-widget__title">
          {{ lastCheckin ? `Semana del ${lastCheckinDate}` : 'Sin check-ins' }}
        </span>
        <span v-if="lastCheckin" class="c360-widget__meta">
          Sueño {{ lastCheckin.sleep_quality }}/5 · Estrés {{ lastCheckin.stress_level }}/5
        </span>
        <span class="c360-widget__meta">{{ counts.checkins }} en historial</span>
      </button>

      <button
        type="button"
        class="c360-widget"
        @click="emit('go-tab', 'nutricion')"
      >
        <span class="c360-widget__label">Nutrición</span>
        <span class="c360-widget__title">
          {{ nutrition ? `${nutrition.calories} kcal` : 'Sin targets' }}
        </span>
        <span v-if="nutrition" class="c360-widget__meta">
          P {{ nutrition.protein_g }} · C {{ nutrition.carbs_g }} · G {{ nutrition.fats_g }}
        </span>
        <span v-else class="c360-widget__meta">Asigna macros al alumno</span>
      </button>

      <div class="c360-widget c360-widget--static">
        <span class="c360-widget__label">PRs del mes</span>
        <span class="c360-widget__title">
          {{ prsLabel || '0 PRs este mes' }}
        </span>
        <span class="c360-widget__meta">Récords de peso</span>
      </div>
    </div>

    <div class="c360-actions">
      <v-btn
        color="primary"
        class="font-weight-bold"
        prepend-icon="mdi-dumbbell"
        @click="emit('go-tab', 'programacion')"
      >
        Programar
      </v-btn>
      <v-btn
        variant="outlined"
        color="primary"
        prepend-icon="mdi-message-text-outline"
        @click="emit('go-tab', 'chat')"
      >
        Mensajes
      </v-btn>
      <v-btn
        variant="text"
        color="primary"
        prepend-icon="mdi-chart-line"
        @click="emit('go-tab', 'graficas')"
      >
        Ver gráficas
      </v-btn>
    </div>

    <section class="c360-panel">
      <div class="c360-panel__head">
        <h2 class="c360-panel__title">Entrenamientos recientes</h2>
        <span class="c360-panel__hint">
          {{ clientName ? `Historial de ${clientName}` : 'Toca para detalle' }}
        </span>
      </div>
      <WorkoutSessionHistoryList
        :sessions="sessions"
        compact
        empty-text="Sin sesiones registradas."
      />
    </section>
  </div>
</template>

<style scoped>
.c360-overview {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.c360-overview__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.55rem;
}

@media (min-width: 600px) {
  .c360-overview__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .c360-overview__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.c360-widget {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  text-align: left;
  padding: 0.75rem 0.85rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.c360-widget:hover {
  background: rgba(0, 229, 255, 0.06);
  border-color: rgba(0, 229, 255, 0.22);
}

.c360-widget--static {
  cursor: default;
}

.c360-widget--static:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

.c360-widget__label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8b929e;
}

.c360-widget__title {
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.25;
}

.c360-widget__meta {
  font-size: 0.72rem;
  color: #8b929e;
}

.c360-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.c360-panel {
  padding: 0.8rem 0.85rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.c360-panel__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  margin-bottom: 0.55rem;
}

.c360-panel__title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
}

.c360-panel__hint {
  font-size: 0.72rem;
  color: #8b929e;
}
</style>
