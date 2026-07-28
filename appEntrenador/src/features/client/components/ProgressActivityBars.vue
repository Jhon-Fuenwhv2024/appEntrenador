<script setup>
import { computed } from 'vue';

const props = defineProps({
  /** [{ key, label, count, intensity }] */
  weeks: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  /** Texto de contexto bajo el título (p. ej. "últimas 4 semanas"). */
  hint: {
    type: String,
    default: '',
  },
});

const maxCount = computed(() => {
  const max = Math.max(0, ...props.weeks.map((w) => Number(w.count) || 0));
  return Math.max(max, 1);
});

const totalInWindow = computed(() => (
  props.weeks.reduce((sum, w) => sum + (Number(w.count) || 0), 0)
));

const weekCount = computed(() => Math.max(props.weeks.length, 1));

const resolvedHint = computed(() => {
  if (props.hint) return props.hint;
  return `Sesiones completadas · últimas ${weekCount.value} semanas`;
});

const chartAriaLabel = computed(() => (
  `${totalInWindow.value} sesiones en ${weekCount.value} semanas`
));

function barHeight(count) {
  const pct = Math.round(((Number(count) || 0) / maxCount.value) * 100);
  return `${Math.max(pct, count > 0 ? 18 : 6)}%`;
}
</script>

<template>
  <section class="activity-bars" aria-label="Actividad por semana">
    <div class="activity-bars__head">
      <div>
        <h2 class="activity-bars__title">Actividad</h2>
        <p class="activity-bars__hint">{{ resolvedHint }}</p>
      </div>
      <span class="activity-bars__total">
        {{ loading ? '—' : totalInWindow }}
      </span>
    </div>

    <div v-if="loading" class="activity-bars__skeleton">
      <v-progress-linear indeterminate color="primary" height="2" />
    </div>

    <div
      v-else
      class="activity-bars__chart"
      role="img"
      :aria-label="chartAriaLabel"
      :style="{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }"
    >
      <div
        v-for="week in weeks"
        :key="week.key"
        class="activity-bars__col"
      >
        <div class="activity-bars__track">
          <div
            class="activity-bars__fill"
            :class="{ 'activity-bars__fill--empty': !week.count }"
            :style="{ height: barHeight(week.count) }"
            :title="`${week.label}: ${week.count}`"
          />
        </div>
        <span class="activity-bars__label">{{ week.label }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.activity-bars {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.activity-bars__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.activity-bars__title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--tf-on-surface, #fff);
}

.activity-bars__hint {
  margin: 2px 0 0;
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.activity-bars__total {
  font-size: 1.1rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  font-variant-numeric: tabular-nums;
}

.activity-bars__chart {
  display: grid;
  gap: 4px;
  align-items: end;
  min-height: 88px;
}

.activity-bars__col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.activity-bars__track {
  width: 100%;
  height: 64px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.activity-bars__fill {
  width: 70%;
  max-width: 14px;
  border-radius: 4px 4px 2px 2px;
  background: linear-gradient(180deg, #00e5ff 0%, rgba(0, 229, 255, 0.35) 100%);
  transition: height 0.25s ease;
}

.activity-bars__fill--empty {
  background: rgba(255, 255, 255, 0.08);
}

.activity-bars__label {
  font-size: 0.52rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  white-space: nowrap;
  overflow: hidden;
  max-width: 100%;
  text-overflow: clip;
  transform: scale(0.92);
}

@media (max-width: 390px) {
  .activity-bars__label {
    font-size: 0;
  }

  .activity-bars__col:nth-child(odd) .activity-bars__label {
    font-size: 0.5rem;
  }
}
</style>
