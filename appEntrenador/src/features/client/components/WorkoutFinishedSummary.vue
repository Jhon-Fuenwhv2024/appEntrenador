<script setup>
/**
 * Feature 059 polish — post-workout summary (duration / sets / volume / exercises).
 * Pattern: Strong/Hevy finish card — hero + metric strip + status + CTA.
 */
defineProps({
  routineName: {
    type: String,
    default: '',
  },
  durationLabel: {
    type: String,
    default: '00:00',
  },
  setsCount: {
    type: Number,
    default: 0,
  },
  exercisesCount: {
    type: Number,
    default: 0,
  },
  /** Total volume kg (sum weight × reps). */
  volumeKg: {
    type: Number,
    default: 0,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  saved: {
    type: Boolean,
    default: false,
  },
  saveError: {
    type: String,
    default: '',
  },
  streakMessage: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['retry', 'done']);

function formatVolume(kg) {
  const n = Number(kg) || 0;
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}t`;
  }
  return `${Math.round(n)}`;
}
</script>

<template>
  <div class="finish">
    <div class="finish__hero" aria-hidden="true">
      <div class="finish__glow" />
      <div class="finish__badge">
        <v-icon icon="mdi-check-bold" size="36" />
      </div>
    </div>

    <p class="finish__eyebrow">Sesión completada</p>
    <h1 class="finish__title">¡Buen trabajo!</h1>
    <p v-if="routineName" class="finish__routine">{{ routineName }}</p>

    <div class="finish__stats" role="group" aria-label="Resumen del entrenamiento">
      <div class="finish__stat">
        <span class="finish__stat-value">{{ durationLabel }}</span>
        <span class="finish__stat-label">Tiempo</span>
      </div>
      <div class="finish__stat">
        <span class="finish__stat-value">{{ setsCount }}</span>
        <span class="finish__stat-label">Series</span>
      </div>
      <div class="finish__stat">
        <span class="finish__stat-value">{{ exercisesCount }}</span>
        <span class="finish__stat-label">Ejercicios</span>
      </div>
      <div class="finish__stat">
        <span class="finish__stat-value">{{ formatVolume(volumeKg) }}</span>
        <span class="finish__stat-label">Volumen kg</span>
      </div>
    </div>

    <v-progress-linear
      v-if="saving"
      indeterminate
      color="primary"
      class="finish__saving"
    />

    <div v-else-if="saveError" class="finish__status finish__status--error">
      <p class="finish__status-text">{{ saveError }}</p>
      <button type="button" class="finish__retry" @click="emit('retry')">
        Reintentar guardar
      </button>
    </div>

    <div v-else-if="saved" class="finish__status finish__status--ok">
      <v-icon icon="mdi-cloud-check-outline" size="20" class="finish__status-icon" />
      <div class="finish__status-copy">
        <p class="finish__status-text">Entrenamiento guardado</p>
        <p v-if="streakMessage" class="finish__streak">{{ streakMessage }}</p>
      </div>
    </div>

    <p v-else class="finish__pending">Guardando tu sesión…</p>

    <button type="button" class="finish__cta" @click="emit('done')">
      Volver al inicio
    </button>
  </div>
</template>

<style scoped>
.finish {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 22rem;
  margin: 0 auto;
  padding: 8px 0 4px;
}

.finish__hero {
  position: relative;
  width: 96px;
  height: 96px;
  margin-bottom: 16px;
  display: grid;
  place-items: center;
}

.finish__glow {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(0, 229, 255, 0.35) 0%,
    rgba(0, 229, 255, 0.08) 45%,
    transparent 70%
  );
  pointer-events: none;
}

.finish__badge {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #00E5FF 0%, #00B8D4 100%);
  color: #0B0D12;
  box-shadow: 0 12px 32px rgba(0, 229, 255, 0.35);
}

.finish__eyebrow {
  margin: 0 0 4px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #00E5FF;
}

.finish__title {
  margin: 0 0 4px;
  font-size: clamp(1.6rem, 7vw, 2rem);
  font-weight: 800;
  line-height: 1.15;
  color: #fff;
}

.finish__routine {
  margin: 0 0 20px;
  font-size: 0.95rem;
  color: #8B929E;
}

.finish__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
  margin-bottom: 16px;
}

.finish__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.finish__stat-value {
  font-variant-numeric: tabular-nums;
  font-size: 1.35rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.01em;
}

.finish__stat-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8B929E;
}

.finish__saving {
  width: 100%;
  margin-bottom: 16px;
  border-radius: 4px;
}

.finish__status {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 16px;
  border-radius: 14px;
  text-align: left;
}

.finish__status--ok {
  border: 1px solid rgba(47, 191, 113, 0.35);
  background: rgba(47, 191, 113, 0.1);
}

.finish__status--error {
  flex-direction: column;
  border: 1px solid rgba(255, 138, 128, 0.35);
  background: rgba(255, 138, 128, 0.08);
}

.finish__status-icon {
  color: #2FBF71;
  flex-shrink: 0;
  margin-top: 1px;
}

.finish__status-copy {
  min-width: 0;
  flex: 1;
}

.finish__status-text {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #C5CAD3;
}

.finish__status--ok .finish__status-text {
  color: #2FBF71;
}

.finish__streak {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: #8B929E;
}

.finish__retry {
  margin-top: 8px;
  align-self: stretch;
  min-height: 40px;
  border: 0;
  border-radius: 10px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

.finish__pending {
  margin: 0 0 16px;
  font-size: 0.85rem;
  color: #8B929E;
}

.finish__cta {
  min-height: 64px;
  height: 64px;
  width: 100%;
  border: 0;
  border-radius: 16px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 229, 255, 0.22);
}
</style>
