<script setup>
/**
 * Widget de racha + meta semanal en Inicio cliente (Feature 042).
 */
import { computed, onMounted, shallowRef } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getMyConsistency } from '../api/consistencyApi.js';

const props = defineProps({
  /** Si se pasa desde el padre (p.ej. post-sesión), evita fetch. */
  initial: { type: Object, default: null },
  skipFetch: { type: Boolean, default: false },
  /** Densidad reducida para fila lado a lado con Hábitos. */
  compact: { type: Boolean, default: false },
});

const loading = shallowRef(!props.initial);
const loadError = shallowRef('');
const data = shallowRef(props.initial);

const streak = computed(() => Number(data.value?.current_streak) || 0);
const best = computed(() => Number(data.value?.best_streak) || 0);
const weekGoal = computed(() => Number(data.value?.week_goal) || 3);
const workouts = computed(() => Number(data.value?.workouts_this_week) || 0);
const score = computed(() => Number(data.value?.score) || 0);

const progressPct = computed(() => {
  if (weekGoal.value <= 0) return 0;
  return Math.min(100, Math.round((workouts.value / weekGoal.value) * 100));
});

const ringStyle = computed(() => ({
  background: `conic-gradient(
    rgb(var(--v-theme-primary)) ${progressPct.value * 3.6}deg,
    rgba(255, 255, 255, 0.08) 0deg
  )`,
}));

async function load() {
  if (props.skipFetch && props.initial) {
    data.value = props.initial;
    loading.value = false;
    return;
  }
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getMyConsistency();
    data.value = response.data?.data ?? null;
  } catch (error) {
    console.error('Error cargando consistencia:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar tu racha');
  } finally {
    loading.value = false;
  }
}

onMounted(load);

defineExpose({ reload: load });
</script>

<template>
  <section
    class="consistency-ring"
    :class="{ 'consistency-ring--compact': compact }"
    aria-label="Racha y meta semanal"
  >
    <v-progress-linear v-if="loading" indeterminate color="primary" height="2" class="mb-2" />

    <v-alert
      v-else-if="loadError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-0"
    >
      {{ loadError }}
    </v-alert>

    <div v-else class="consistency-ring__row">
      <div class="consistency-ring__dial" :style="ringStyle" :aria-valuenow="progressPct">
        <div class="consistency-ring__dial-inner">
          <v-icon icon="mdi-fire" :size="compact ? 20 : 22" color="primary" />
          <strong>{{ streak }}</strong>
        </div>
      </div>

      <div class="consistency-ring__copy">
        <p class="consistency-ring__title">
          Racha:
          <span class="text-cyan">{{ streak }}</span>
          día{{ streak === 1 ? '' : 's' }}
        </p>
        <p class="consistency-ring__meta">
          Meta {{ workouts }}/{{ weekGoal }} · Score {{ score }}
        </p>
        <p v-if="best > 0" class="consistency-ring__best">
          Mejor racha: {{ best }} días
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.consistency-ring {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  height: 100%;
  min-height: 108px;
  box-sizing: border-box;
}

.consistency-ring--compact {
  padding: 10px 12px;
  border-radius: 12px;
}

.consistency-ring__row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.consistency-ring--compact .consistency-ring__row {
  gap: 0.65rem;
}

.consistency-ring__dial {
  flex-shrink: 0;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.consistency-ring--compact .consistency-ring__dial {
  width: 58px;
  height: 58px;
}

.consistency-ring__dial-inner {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #0b0d12;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1;
}

.consistency-ring--compact .consistency-ring__dial-inner {
  width: 44px;
  height: 44px;
  font-size: 0.9rem;
}

.consistency-ring__copy {
  min-width: 0;
  flex: 1;
}

.consistency-ring__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.25;
}

.consistency-ring--compact .consistency-ring__title {
  font-size: 0.9rem;
}

.consistency-ring__meta,
.consistency-ring__best {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: #8b929e;
  line-height: 1.3;
}

.consistency-ring--compact .consistency-ring__meta,
.consistency-ring--compact .consistency-ring__best {
  font-size: 0.72rem;
  margin-top: 0.2rem;
}

.text-cyan {
  color: rgb(var(--v-theme-primary));
}
</style>
