<script setup>
import { computed } from 'vue';
import {
  getExerciseMediaKind,
  resolveExerciseMediaSrc,
} from '../../../shared/utils/exerciseDisplay.js';

/**
 * Feature 059 — Rest phase ring + ±15 / Skip + Up next.
 * Feature 087 — Up next tappable (tech sheet); clearer set/weight preview.
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

const emit = defineEmits(['adjust', 'skip', 'preview']);

const SIZE = 176;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const dashOffset = computed(() => {
  const p = Math.min(1, Math.max(0, Number(props.progress) || 0));
  return CIRCUMFERENCE * (1 - p);
});

const nextTitle = computed(() => props.nextPreview?.nombre || '');

const nextSetNumber = computed(() => Number(props.nextPreview?.setNumber) || 0);

const nextTotalSets = computed(() => Number(props.nextPreview?.totalSets) || 0);

const nextSetLabel = computed(() => {
  if (!props.nextPreview) return '';
  if (nextTotalSets.value > 0 && nextSetNumber.value > 0) {
    return `${nextSetNumber.value}/${nextTotalSets.value}`;
  }
  return props.nextPreview.label || '';
});

const nextWeight = computed(() => {
  const w = Number(props.nextPreview?.weight);
  return Number.isFinite(w) && w > 0 ? w : null;
});

const nextReps = computed(() => {
  const r = Number(props.nextPreview?.reps);
  return Number.isFinite(r) && r > 0 ? r : null;
});

const thumbSrc = computed(() => {
  const preview = props.nextPreview;
  if (!preview) return null;
  return resolveExerciseMediaSrc({
    local_media_path: preview.local_media_path,
    media_url: preview.media_url,
  });
});

const thumbKind = computed(() => (
  getExerciseMediaKind(thumbSrc.value, props.nextPreview?.media_type)
));

const showThumb = computed(() => (
  thumbKind.value === 'gif'
  || thumbKind.value === 'image'
  || thumbKind.value === 'video'
));

const thumbIsVideo = computed(() => thumbKind.value === 'video');

const ariaUpNext = computed(() => {
  const parts = [`Ver ficha de ${nextTitle.value}`];
  if (nextSetLabel.value) parts.push(`Serie ${nextSetLabel.value}`);
  if (nextWeight.value != null) parts.push(`${nextWeight.value} kg`);
  if (nextReps.value != null) parts.push(`${nextReps.value} reps`);
  return parts.join('. ');
});
</script>

<template>
  <div class="rest-ring">
    <p class="rest-ring__step">Descanso · {{ restDuration }}s</p>

    <div class="rest-ring__visual">
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

    <button
      v-if="nextPreview"
      type="button"
      class="rest-ring__upnext"
      :aria-label="ariaUpNext"
      @click="emit('preview')"
    >
      <div class="rest-ring__upnext-top">
        <video
          v-if="showThumb && thumbIsVideo && thumbSrc"
          class="rest-ring__upnext-thumb"
          :src="thumbSrc"
          width="52"
          height="52"
          autoplay
          loop
          muted
          playsinline
          preload="metadata"
          aria-hidden="true"
        />
        <img
          v-else-if="showThumb && thumbSrc"
          class="rest-ring__upnext-thumb"
          :src="thumbSrc"
          alt=""
          width="52"
          height="52"
        >
        <div class="rest-ring__upnext-heading">
          <span class="rest-ring__upnext-label">Siguiente</span>
          <span class="rest-ring__upnext-name">{{ nextTitle }}</span>
        </div>
        <v-icon
          class="rest-ring__upnext-chevron"
          icon="mdi-chevron-right"
          size="22"
          aria-hidden="true"
        />
      </div>

      <div class="rest-ring__stats" aria-hidden="false">
        <div class="rest-ring__stat">
          <span class="rest-ring__stat-value">{{ nextSetLabel || '—' }}</span>
          <span class="rest-ring__stat-label">Serie</span>
        </div>
        <div class="rest-ring__stat">
          <span class="rest-ring__stat-value">
            {{ nextWeight != null ? nextWeight : '—' }}
            <span v-if="nextWeight != null" class="rest-ring__stat-unit">kg</span>
          </span>
          <span class="rest-ring__stat-label">Peso</span>
        </div>
        <div class="rest-ring__stat">
          <span class="rest-ring__stat-value">
            {{ nextReps != null ? nextReps : '—' }}
            <span v-if="nextReps != null" class="rest-ring__stat-unit">reps</span>
          </span>
          <span class="rest-ring__stat-label">Reps</span>
        </div>
      </div>

      <span class="rest-ring__upnext-hint">Toca para ver la ficha técnica</span>
    </button>

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
  max-width: 24rem;
  margin: 0.75rem auto 0;
  padding: 0 0 8px;
}

.rest-ring__step {
  margin: 0 0 8px;
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.rest-ring__visual {
  position: relative;
  width: 176px;
  height: 176px;
  margin: 0 auto 1rem;
  flex-shrink: 0;
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
  font-size: clamp(2.35rem, 12vw, 2.85rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  color: #00E5FF;
  pointer-events: none;
}

.rest-ring__upnext {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 0.9rem 0.75rem;
  margin-bottom: 12px;
  border-radius: 16px;
  border: 1px solid rgba(0, 229, 255, 0.28);
  background: rgba(0, 229, 255, 0.07);
  text-align: left;
  cursor: pointer;
  color: inherit;
  font: inherit;
}

.rest-ring__upnext:active {
  transform: scale(0.99);
  background: rgba(0, 229, 255, 0.12);
}

.rest-ring__upnext:focus-visible {
  outline: 2px solid #00E5FF;
  outline-offset: 2px;
}

.rest-ring__upnext-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.rest-ring__upnext-thumb {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  object-fit: cover;
  background: rgba(0, 0, 0, 0.35);
}

.rest-ring__upnext-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.rest-ring__upnext-chevron {
  flex-shrink: 0;
  color: #00E5FF;
  opacity: 0.85;
}

.rest-ring__upnext-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #00E5FF;
}

.rest-ring__upnext-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  overflow-wrap: anywhere;
  line-height: 1.25;
}

.rest-ring__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
  width: 100%;
}

.rest-ring__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  min-height: 4.25rem;
  padding: 0.5rem 0.25rem;
  border-radius: 12px;
  background: rgba(11, 13, 18, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.rest-ring__stat-value {
  font-size: clamp(1.25rem, 5.5vw, 1.55rem);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #fff;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.rest-ring__stat-unit {
  font-size: 0.7em;
  font-weight: 700;
  color: #00E5FF;
  margin-left: 0.1em;
}

.rest-ring__stat-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.rest-ring__upnext-hint {
  font-size: 0.7rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  text-align: center;
}

.rest-ring__controls {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-bottom: 10px;
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

.rest-ring__adj:focus-visible,
.rest-ring__skip:focus-visible {
  outline: 2px solid #00E5FF;
  outline-offset: 2px;
}

.rest-ring__skip {
  min-height: 52px;
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
