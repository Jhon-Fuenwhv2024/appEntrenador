<script setup>
import { computed } from 'vue';
import { displayExerciseMuscle } from '../../../shared/utils/exerciseDisplay.js';
import WorkoutExerciseMedia from './WorkoutExerciseMedia.vue';
import WorkoutHintExpandable from './WorkoutHintExpandable.vue';

/**
 * Feature 087 — Technical sheet for the upcoming exercise during rest.
 * Mount media only while open (v-if) so video/iframe unmount on close.
 */
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  preview: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', Boolean(value)),
});

const title = computed(() => props.preview?.nombre || 'Siguiente ejercicio');

const description = computed(() => {
  const text = props.preview?.description
    || props.preview?.indicaciones
    || props.preview?.description_es
    || '';
  return typeof text === 'string' ? text.trim() : '';
});

const muscleLabel = computed(() => {
  if (!props.preview) return '';
  return displayExerciseMuscle(props.preview) || '';
});

const setNumber = computed(() => Number(props.preview?.setNumber) || 0);

const totalSets = computed(() => Number(props.preview?.totalSets) || 0);

const setValue = computed(() => {
  if (setNumber.value > 0 && totalSets.value > 0) {
    return `${setNumber.value}/${totalSets.value}`;
  }
  if (props.preview?.label) return props.preview.label.replace(/^Serie\s+/i, '');
  return '—';
});

const weightValue = computed(() => {
  const w = Number(props.preview?.weight);
  return Number.isFinite(w) && w > 0 ? w : null;
});

const repsValue = computed(() => {
  const r = Number(props.preview?.reps);
  return Number.isFinite(r) && r > 0 ? r : null;
});
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="420"
    scrollable
    :scrim="true"
    content-class="tf-overlay-menu next-tech-sheet-dialog"
  >
    <v-card
      v-if="open && preview"
      class="next-tech-sheet"
      bg-color="surface"
    >
      <v-card-title class="next-tech-sheet__header">
        <div class="next-tech-sheet__header-text">
          <span class="next-tech-sheet__eyebrow">Ficha técnica</span>
          <h2 class="next-tech-sheet__title">{{ title }}</h2>
        </div>
        <button
          type="button"
          class="next-tech-sheet__close"
          aria-label="Cerrar ficha técnica"
          @click="open = false"
        >
          <v-icon icon="mdi-close" size="22" />
        </button>
      </v-card-title>

      <v-card-text class="next-tech-sheet__body">
        <WorkoutExerciseMedia
          class="next-tech-sheet__media"
          :media-type="preview.media_type"
          :media-url="preview.media_url"
          :local-media-path="preview.local_media_path"
          :exercise-name="title"
        />

        <div class="next-tech-sheet__stats" aria-label="Prescripción de la siguiente serie">
          <div class="next-tech-sheet__stat">
            <span class="next-tech-sheet__stat-value">{{ setValue }}</span>
            <span class="next-tech-sheet__stat-label">Serie</span>
          </div>
          <div class="next-tech-sheet__stat">
            <span class="next-tech-sheet__stat-value">
              {{ weightValue != null ? weightValue : '—' }}
              <span v-if="weightValue != null" class="next-tech-sheet__stat-unit">kg</span>
            </span>
            <span class="next-tech-sheet__stat-label">Peso</span>
          </div>
          <div class="next-tech-sheet__stat">
            <span class="next-tech-sheet__stat-value">
              {{ repsValue != null ? repsValue : '—' }}
              <span v-if="repsValue != null" class="next-tech-sheet__stat-unit">reps</span>
            </span>
            <span class="next-tech-sheet__stat-label">Reps</span>
          </div>
        </div>

        <section class="next-tech-sheet__section" aria-label="Músculos">
          <h3 class="next-tech-sheet__label">Músculos</h3>
          <p
            class="next-tech-sheet__muscle"
            :class="{ 'next-tech-sheet__muscle--empty': !muscleLabel }"
          >
            {{ muscleLabel || 'Sin musculatura etiquetada' }}
          </p>
        </section>

        <section class="next-tech-sheet__section" aria-label="Descripción">
          <h3 class="next-tech-sheet__label">Descripción / indicaciones</h3>
          <WorkoutHintExpandable
            v-if="description"
            :text="description"
          />
          <p v-else class="next-tech-sheet__empty-desc">
            Sin descripción. Sigue las indicaciones de tu entrenador.
          </p>
        </section>
      </v-card-text>

      <v-card-actions class="next-tech-sheet__actions">
        <v-btn
          color="primary"
          variant="flat"
          class="next-tech-sheet__done"
          min-height="48"
          block
          @click="open = false"
        >
          Entendido
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.next-tech-sheet {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px !important;
  overflow: hidden;
}

.next-tech-sheet__header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1rem 0.35rem;
}

.next-tech-sheet__header-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.next-tech-sheet__eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #00e5ff;
}

.next-tech-sheet__title {
  margin: 0;
  font-size: clamp(1.05rem, 4.2vw, 1.25rem);
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
  word-break: break-word;
  color: #fff;
}

.next-tech-sheet__close {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.next-tech-sheet__close:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
}

.next-tech-sheet__body {
  padding-top: 0.35rem !important;
  padding-bottom: 0.25rem !important;
}

.next-tech-sheet__media {
  margin-bottom: 0.85rem;
  max-height: min(36vh, 260px);
}

.next-tech-sheet__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.45rem;
  margin: 0 0 1rem;
}

.next-tech-sheet__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  min-height: 4.5rem;
  padding: 0.55rem 0.3rem;
  border-radius: 12px;
  background: rgba(0, 229, 255, 0.07);
  border: 1px solid rgba(0, 229, 255, 0.22);
}

.next-tech-sheet__stat-value {
  font-size: clamp(1.2rem, 5vw, 1.5rem);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #fff;
  line-height: 1.1;
}

.next-tech-sheet__stat-unit {
  font-size: 0.65em;
  font-weight: 700;
  color: #00e5ff;
  margin-left: 0.1em;
}

.next-tech-sheet__stat-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.next-tech-sheet__section {
  margin-bottom: 0.9rem;
  text-align: left;
}

.next-tech-sheet__label {
  margin: 0 0 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #00e5ff;
}

.next-tech-sheet__muscle {
  display: inline-block;
  margin: 0;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  color: #fff;
  background: rgba(0, 229, 255, 0.12);
  border: 1px solid rgba(0, 229, 255, 0.3);
}

.next-tech-sheet__muscle--empty {
  color: var(--tf-on-surface-muted, #a8b0bc);
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  font-weight: 500;
}

.next-tech-sheet__empty-desc {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.next-tech-sheet__section :deep(.hint-expand) {
  margin-bottom: 0;
}

.next-tech-sheet__section :deep(.hint-expand__toggle) {
  min-height: 44px;
  padding: 0.25rem 0;
  margin-top: 0.15rem;
  border: 0;
  background: transparent;
  color: #00e5ff;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
}

.next-tech-sheet__section :deep(.hint-expand__toggle:focus-visible) {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
  border-radius: 4px;
}

.next-tech-sheet__actions {
  padding: 0.5rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px)) !important;
}

.next-tech-sheet__done {
  font-weight: 700;
}
</style>
