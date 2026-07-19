<script setup>
import { computed } from 'vue';
import {
  getExerciseMediaKind,
  resolveExerciseMediaSrc,
} from '../../../shared/utils/exerciseDisplay.js';

const props = defineProps({
  exercise: {
    type: Object,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
});

const resolvedSrc = computed(() => resolveExerciseMediaSrc(props.exercise));

const kind = computed(() => (
  getExerciseMediaKind(resolvedSrc.value, props.exercise?.media_type)
));
</script>

<template>
  <div class="tagger-media">
    <video
      v-if="kind === 'video'"
      :key="resolvedSrc"
      class="tagger-media__frame"
      :src="resolvedSrc"
      autoplay
      loop
      muted
      playsinline
    />
    <img
      v-else-if="kind === 'gif' || kind === 'image'"
      :key="resolvedSrc"
      class="tagger-media__frame"
      :src="resolvedSrc"
      :alt="title || 'Ejercicio'"
    />
    <div
      v-else
      class="tagger-media__fallback"
    >
      <v-icon
        icon="mdi-image-off-outline"
        size="40"
        color="#5E6673"
      />
      <p class="tagger-media__fallback-text">
        Sin media local disponible
      </p>
    </div>
  </div>
</template>

<style scoped>
.tagger-media {
  width: 100%;
  max-width: 420px;
  margin-inline: auto;
  height: min(38vh, 340px);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tagger-media__frame {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #0b0d12;
}

.tagger-media__fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem;
  text-align: center;
}

.tagger-media__fallback-text {
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.85rem;
}

@media (min-width: 960px) {
  .tagger-media {
    max-width: none;
    height: min(70vh, 520px);
    position: sticky;
    top: 0;
  }
}

@media (max-width: 600px) {
  .tagger-media {
    height: min(32vh, 260px);
  }
}
</style>
