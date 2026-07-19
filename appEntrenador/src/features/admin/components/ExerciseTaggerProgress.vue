<script setup>
import { computed } from 'vue';

const props = defineProps({
  tagged: {
    type: Number,
    default: 0,
  },
  remaining: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  percent: {
    type: Number,
    default: 0,
  },
});

const clampedPercent = computed(() => (
  Math.min(100, Math.max(0, Number(props.percent) || 0))
));
</script>

<template>
  <div
    class="tagger-progress"
    role="status"
    :aria-label="`Progreso de etiquetado: ${clampedPercent}%`"
  >
    <div class="tagger-progress__row">
      <span class="tagger-progress__percent">
        {{ clampedPercent }}%
      </span>
      <span class="tagger-progress__counts">
        {{ tagged }} etiquetados · {{ remaining }} faltan
        <span
          v-if="total > 0"
          class="tagger-progress__total"
        >
          ({{ total }} total)
        </span>
      </span>
    </div>
    <v-progress-linear
      class="tagger-progress__bar"
      :model-value="clampedPercent"
      color="primary"
      bg-color="surface-variant"
      height="10"
      rounded
    />
  </div>
</template>

<style scoped>
.tagger-progress {
  width: 100%;
  margin-bottom: 0.85rem;
  text-align: left;
}

.tagger-progress__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
  margin-bottom: 0.4rem;
}

.tagger-progress__percent {
  font-size: 1.05rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  letter-spacing: 0.02em;
}

.tagger-progress__counts {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.62);
}

.tagger-progress__total {
  color: rgba(255, 255, 255, 0.4);
}

.tagger-progress__bar {
  overflow: hidden;
}
</style>
