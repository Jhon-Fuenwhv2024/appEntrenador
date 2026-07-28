<script setup>
/**
 * Hero de estado instantáneo para Mi progreso (Feature 072).
 * Señales: racha, sesiones 7d, delta de peso (si ≥2 logs).
 */
import { computed } from 'vue';
import { computeWeightDelta } from '../composables/useProgressRange.js';

const props = defineProps({
  currentStreak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  sessionsLast7Days: { type: Number, default: 0 },
  /** Logs body composition (weight_kg + measured_at). */
  bodyLogs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  /** CTA primaria de check-in en el hero. */
  showCheckinCta: { type: Boolean, default: true },
});

const emit = defineEmits(['checkin']);

const weightDelta = computed(() => computeWeightDelta(props.bodyLogs));

const weightDeltaLabel = computed(() => {
  const d = weightDelta.value;
  if (!d) return null;
  if (Math.abs(d.deltaKg) < 0.05) return '0 kg';
  const sign = d.deltaKg > 0 ? '+' : '';
  return `${sign}${d.deltaKg} kg`;
});

const weightDeltaDirection = computed(() => {
  const d = weightDelta.value;
  if (!d) return null;
  if (Math.abs(d.deltaKg) < 0.05) return 'stable';
  return d.deltaKg > 0 ? 'up' : 'down';
});

const weightDeltaIcon = computed(() => {
  const dir = weightDeltaDirection.value;
  if (dir === 'up') return 'mdi-trending-up';
  if (dir === 'down') return 'mdi-trending-down';
  if (dir === 'stable') return 'mdi-approximately-equal';
  return 'mdi-scale-bathroom';
});

const weightDeltaHint = computed(() => {
  if (!weightDelta.value) {
    return 'Entrena y registra peso para ver tu evolución';
  }
  if (weightDeltaDirection.value === 'stable') return 'Sin cambio vs anterior';
  return 'vs medición anterior';
});
</script>

<template>
  <section class="progress-hero" aria-label="Resumen de tu progreso">
    <div class="progress-hero__signals">
      <div class="progress-hero__signal">
        <p class="progress-hero__label">Racha</p>
        <p class="progress-hero__value progress-hero__value--accent">
          <v-icon
            icon="mdi-fire"
            size="18"
            class="progress-hero__fire"
            aria-hidden="true"
          />
          {{ loading ? '—' : currentStreak }}
        </p>
        <p class="progress-hero__hint">
          <template v-if="loading">…</template>
          <template v-else-if="bestStreak > 0">
            días · mejor {{ bestStreak }}
          </template>
          <template v-else>
            días seguidos
          </template>
        </p>
      </div>

      <div class="progress-hero__signal">
        <p class="progress-hero__label">Esta semana</p>
        <p class="progress-hero__value">
          {{ loading ? '—' : sessionsLast7Days }}
        </p>
        <p class="progress-hero__hint">sesiones · 7 días</p>
      </div>

      <div
        class="progress-hero__signal"
        :class="{
          'progress-hero__signal--up': weightDeltaDirection === 'up',
          'progress-hero__signal--down': weightDeltaDirection === 'down',
        }"
      >
        <p class="progress-hero__label">Peso</p>
        <p
          class="progress-hero__value"
          :class="{
            'progress-hero__value--up': weightDeltaDirection === 'up',
            'progress-hero__value--down': weightDeltaDirection === 'down',
            'progress-hero__value--muted': !weightDelta,
          }"
        >
          <v-icon
            v-if="weightDeltaLabel"
            :icon="weightDeltaIcon"
            size="16"
            aria-hidden="true"
          />
          {{ loading ? '—' : (weightDeltaLabel || '—') }}
        </p>
        <p class="progress-hero__hint">{{ loading ? '…' : weightDeltaHint }}</p>
      </div>
    </div>

    <div v-if="showCheckinCta" class="progress-hero__cta">
      <v-btn
        color="primary"
        size="small"
        min-height="44"
        class="progress-hero__checkin"
        prepend-icon="mdi-clipboard-check-outline"
        @click="emit('checkin')"
      >
        Check-in semanal
      </v-btn>
    </div>
  </section>
</template>

<style scoped>
.progress-hero {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.progress-hero__signals {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.progress-hero__signal {
  text-align: center;
  min-width: 0;
  padding: 4px 2px;
}

.progress-hero__label {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.progress-hero__value {
  margin: 6px 0 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--tf-on-surface, #fff);
  font-variant-numeric: tabular-nums;
}

.progress-hero__value--accent {
  color: rgb(var(--v-theme-primary));
}

.progress-hero__value--up {
  color: #00e676;
}

.progress-hero__value--down {
  color: #ffab40;
}

.progress-hero__value--muted {
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.progress-hero__fire {
  color: rgb(var(--v-theme-primary));
}

.progress-hero__hint {
  margin: 4px 0 0;
  font-size: 0.62rem;
  line-height: 1.25;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.progress-hero__cta {
  margin-top: 12px;
  display: flex;
  justify-content: stretch;
}

.progress-hero__checkin {
  width: 100%;
  font-weight: 700;
}

.progress-hero__checkin:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

@media (max-width: 390px) {
  .progress-hero__value {
    font-size: 1.1rem;
  }

  .progress-hero__hint {
    font-size: 0.58rem;
  }
}
</style>
