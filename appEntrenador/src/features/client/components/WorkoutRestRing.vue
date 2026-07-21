<script setup>
import { computed } from 'vue';

/**
 * Feature 059 — Rest phase ring + ±15 / Skip + Up next.
 */
const props = defineProps({
  formattedTime: {
    type: String,
    required: true,
  },
  /** Remaining fraction 0–1 (1 = full time left). */
  progress: {
    type: Number,
    default: 1,
  },
  restDuration: {
    type: Number,
    default: 0,
  },
  nextPreview: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['adjust', 'skip']);

const SIZE = 220;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const dashOffset = computed(() => {
  const p = Math.min(1, Math.max(0, Number(props.progress) || 0));
  return CIRCUMFERENCE * (1 - p);
});

const nextTitle = computed(() => props.nextPreview?.nombre || '');
const nextSubtitle = computed(() => {
  if (!props.nextPreview) return '';
  return props.nextPreview.label || `Serie ${props.nextPreview.setNumber || ''}`;
});
</script>

<template>
  <div class="rest-ring">
    <p class="rest-ring__step">Descanso</p>

    <div class="rest-ring__visual" aria-hidden="false">
      <svg
        class="rest-ring__svg"
        :width="SIZE"
        :height="SIZE"
        :viewBox="`0 0 ${SIZE} ${SIZE}`"
        role="img"
        :aria-label="`Quedan ${formattedTime}`"
      >
        <circle
          class="rest-ring__track"
          :cx="SIZE / 2"
          :cy="SIZE / 2"
          :r="RADIUS"
          fill="none"
          :stroke-width="STROKE"
        />
        <circle
          class="rest-ring__progress"
          :cx="SIZE / 2"
          :cy="SIZE / 2"
          :r="RADIUS"
          fill="none"
          :stroke-width="STROKE"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="dashOffset"
          stroke-linecap="round"
        />
      </svg>
      <div class="rest-ring__clock" aria-live="polite">{{ formattedTime }}</div>
    </div>

    <p class="rest-ring__copy">
      Respira. La siguiente serie empieza en breve
      <span class="rest-ring__muted">({{ restDuration }}s)</span>.
    </p>

    <div v-if="nextPreview" class="rest-ring__upnext">
      <span class="rest-ring__upnext-label">Siguiente</span>
      <span class="rest-ring__upnext-name">{{ nextTitle }}</span>
      <span v-if="nextSubtitle" class="rest-ring__upnext-set">{{ nextSubtitle }}</span>
    </div>

    <div class="rest-ring__controls">
      <button
        type="button"
        class="rest-ring__adj"
        aria-label="Restar 15 segundos"
        @click="emit('adjust', -15)"
      >
        −15
      </button>
      <button
        type="button"
        class="rest-ring__adj"
        aria-label="Sumar 15 segundos"
        @click="emit('adjust', 15)"
      >
        +15
      </button>
    </div>

    <button type="button" class="rest-ring__skip" @click="emit('skip')">
      Omitir descanso
    </button>
  </div>
</template>

<style scoped>
.rest-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 22rem;
  margin: 0 auto;
  padding: 8px 0;
}

.rest-ring__step {
  margin: 0 0 8px;
  color: #8B929E;
  font-size: 0.85rem;
}

.rest-ring__visual {
  position: relative;
  width: 220px;
  height: 220px;
  margin: 0 auto 12px;
}

.rest-ring__svg {
  display: block;
  transform: rotate(-90deg);
}

.rest-ring__track {
  stroke: rgba(255, 255, 255, 0.08);
}

.rest-ring__progress {
  stroke: #00E5FF;
  transition: stroke-dashoffset 0.25s linear;
}

.rest-ring__clock {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: clamp(2.75rem, 14vw, 3.5rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  color: #00E5FF;
  pointer-events: none;
}

.rest-ring__copy {
  margin: 0 0 16px;
  color: #C5CAD3;
  line-height: 1.45;
  font-size: 0.95rem;
}

.rest-ring__muted {
  color: #8B929E;
}

.rest-ring__upnext {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 16px;
  border-radius: 14px;
  border: 1px solid rgba(0, 229, 255, 0.2);
  background: rgba(0, 229, 255, 0.06);
  text-align: left;
}

.rest-ring__upnext-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #00E5FF;
}

.rest-ring__upnext-name {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  overflow-wrap: anywhere;
}

.rest-ring__upnext-set {
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  color: #8B929E;
}

.rest-ring__controls {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-bottom: 12px;
}

.rest-ring__adj {
  flex: 1;
  min-height: 48px;
  border-radius: 14px;
  border: 1px solid rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.08);
  color: #00E5FF;
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.rest-ring__adj:active {
  transform: scale(0.98);
}

.rest-ring__skip {
  min-height: 56px;
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(0, 229, 255, 0.45);
  background: transparent;
  color: rgb(var(--v-theme-primary));
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
