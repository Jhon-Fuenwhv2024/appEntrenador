<script setup>
/**
 * Feature 084 — Presentational routine day preview (trainer builder live pane).
 * No fetch; no membership / Empezar CTAs. Media + prescription only (no exercise description).
 */
import { computed } from 'vue';
import WorkoutExerciseMedia from '../../client/components/WorkoutExerciseMedia.vue';
import { prescriptionLabel as formatPrescription } from '../../../shared/routines/setPrescription.js';

const props = defineProps({
  /** Adapted preview model from routineDraftPreviewAdapter. */
  preview: {
    type: Object,
    required: true,
  },
  /** Compact denser cards for narrow split pane. */
  dense: {
    type: Boolean,
    default: false,
  },
});

const exercises = computed(() => (
  Array.isArray(props.preview?.ejercicios) ? props.preview.ejercicios : []
));

const exerciseCountLabel = computed(() => {
  const n = exercises.value.length;
  if (!n) return 'Sin ejercicios';
  return n === 1 ? '1 ejercicio' : `${n} ejercicios`;
});

function exerciseKey(ex, index) {
  return String(ex?.id ?? `${ex?.nombre || 'ex'}-${index}`);
}

function exerciseTitle(ex) {
  return ex?.name_es || ex?.nombre || 'Ejercicio';
}

function prescriptionLabel(ex) {
  return formatPrescription(ex);
}

function restLabel(ex) {
  const sec = Number(ex?.rest_time_seconds);
  if (!Number.isFinite(sec) || sec <= 0) return null;
  if (sec < 60) return `Descanso ${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `Descanso ${m}m ${s}s` : `Descanso ${m}m`;
}
</script>

<template>
  <div
    class="rdp"
    :class="{ 'rdp--dense': dense }"
    role="region"
    aria-label="Vista previa de la rutina"
  >
    <header class="rdp__head">
      <p class="rdp__eyebrow">Vista previa</p>
      <h3 class="rdp__title">
        {{ preview.nombre_rutina || 'Sin nombre' }}
      </h3>
      <p class="rdp__meta">
        <span v-if="preview.dia_semana">{{ preview.dia_semana }}</span>
        <span v-if="preview.dia_semana"> · </span>
        {{ exerciseCountLabel }}
      </p>
    </header>

    <ol v-if="exercises.length" class="rdp__list" aria-label="Ejercicios de la rutina">
      <li
        v-for="(ex, index) in exercises"
        :key="exerciseKey(ex, index)"
        class="rdp-card"
      >
        <div class="rdp-card__head">
          <span class="rdp-card__index">{{ index + 1 }}</span>
          <div class="rdp-card__titles">
            <h4 class="rdp-card__name">{{ exerciseTitle(ex) }}</h4>
            <p class="rdp-card__rx">{{ prescriptionLabel(ex) }}</p>
          </div>
          <span
            v-if="ex.superset_letter"
            class="rdp-card__ss"
            :title="`Superserie ${ex.superset_letter}`"
          >
            {{ ex.superset_letter }}
          </span>
        </div>

        <WorkoutExerciseMedia
          v-if="ex.has_media"
          class="rdp-card__media"
          natural
          :media-type="ex.media_type"
          :media-url="ex.media_url"
          :local-media-path="ex.local_media_path"
          :exercise-name="exerciseTitle(ex)"
        />
        <p v-else class="rdp-card__no-demo">
          Sin demo visual
        </p>

        <p v-if="restLabel(ex)" class="rdp-card__rest">
          <v-icon icon="mdi-timer-outline" size="14" />
          {{ restLabel(ex) }}
        </p>
      </li>
    </ol>

    <p v-else class="rdp__empty">
      Añade ejercicios en el editor para ver la rutina aquí.
    </p>
  </div>
</template>

<style scoped>
.rdp {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  color: var(--tf-on-surface, #e8eaed);
  background:
    radial-gradient(120% 70% at 50% -10%, rgba(0, 229, 255, 0.1), transparent 55%),
    rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  overflow: hidden;
}

.rdp__head {
  flex-shrink: 0;
  padding: 0.75rem 0.85rem 0.55rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(11, 13, 18, 0.55);
}

.rdp__eyebrow {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #00e5ff;
}

.rdp__title {
  margin: 0.15rem 0 0;
  font-size: 1.05rem;
  font-weight: 750;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.rdp__meta {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.rdp__list {
  list-style: none;
  margin: 0;
  padding: 0.65rem 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

.rdp-card {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.03);
  padding: 0.65rem;
  overflow: visible;
}

.rdp-card__head {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.rdp-card__index {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 750;
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
}

.rdp-card__titles {
  min-width: 0;
  flex: 1;
}

.rdp-card__name {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.25;
}

.rdp-card__rx {
  margin: 0.12rem 0 0;
  font-size: 0.7rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.rdp-card__ss {
  flex-shrink: 0;
  min-width: 1.4rem;
  height: 1.4rem;
  padding: 0 0.3rem;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 750;
  color: #00e5ff;
  border: 1px solid rgba(0, 229, 255, 0.4);
  background: rgba(0, 229, 255, 0.1);
}

.rdp-card__media {
  display: block;
  width: 100%;
  margin: 0 0 0.25rem;
}

.rdp-card__media :deep(.workout-media) {
  max-height: 10.5rem;
}

.rdp-card__no-demo {
  margin: 0 0 0.35rem;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  font-size: 0.72rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  text-align: center;
}

.rdp-card__rest {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0.25rem 0 0;
  font-size: 0.7rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.rdp__empty {
  margin: 1.25rem 0.85rem;
  font-size: 0.85rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  text-align: center;
  line-height: 1.4;
}
</style>
