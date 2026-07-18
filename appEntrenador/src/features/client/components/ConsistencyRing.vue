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
  <section class="consistency-ring" aria-label="Racha y meta semanal">
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
          <v-icon icon="mdi-fire" size="22" color="primary" />
          <strong>{{ streak }}</strong>
        </div>
      </div>

      <div class="consistency-ring__copy">
        <p class="consistency-ring__title">
          Racha: <span class="text-cyan">{{ streak }}</span> día{{ streak === 1 ? '' : 's' }}
        </p>
        <p class="consistency-ring__meta">
          Meta semanal {{ workouts }}/{{ weekGoal }} entrenos · Score {{ score }}
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
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.consistency-ring__row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.consistency-ring__dial {
  flex-shrink: 0;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: grid;
  place-items: center;
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

.consistency-ring__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
}

.consistency-ring__meta,
.consistency-ring__best {
  margin: 0.2rem 0 0;
  font-size: 0.72rem;
  color: #8b929e;
}

.text-cyan {
  color: rgb(var(--v-theme-primary));
}
</style>
