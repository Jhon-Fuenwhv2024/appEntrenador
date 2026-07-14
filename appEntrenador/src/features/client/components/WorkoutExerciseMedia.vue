<script setup>
import { computed } from 'vue';

const props = defineProps({
  mediaType: {
    type: String,
    default: 'none',
  },
  mediaUrl: {
    type: String,
    default: null,
  },
  exerciseName: {
    type: String,
    default: '',
  },
});

function youtubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = parsed.pathname.split('/');
      const embedIdx = parts.indexOf('embed');
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

const kind = computed(() => {
  const type = (props.mediaType || 'none').toLowerCase();
  const url = props.mediaUrl?.trim();
  if (!url || type === 'none') return 'none';
  if (type === 'youtube') return 'youtube';
  if (type === 'video') return 'video';
  if (type === 'gif' || type === 'image') return 'image';
  return 'image';
});

const embedSrc = computed(() => (
  kind.value === 'youtube' ? youtubeEmbedUrl(props.mediaUrl) : null
));
</script>

<template>
  <div class="workout-media">
    <iframe
      v-if="kind === 'youtube' && embedSrc"
      class="workout-media__frame"
      :src="embedSrc"
      title="Demostración del ejercicio"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    />
    <video
      v-else-if="kind === 'video'"
      class="workout-media__frame"
      :src="mediaUrl"
      controls
      playsinline
      muted
      loop
      autoplay
    />
    <img
      v-else-if="kind === 'image'"
      class="workout-media__frame"
      :src="mediaUrl"
      :alt="exerciseName || 'Ejercicio'"
    />
    <div v-else class="workout-media__fallback">
      <v-icon icon="mdi-dumbbell" size="48" color="#5E6673" />
      <p class="workout-media__fallback-text">
        Sin demo visual. Sigue el nombre y las indicaciones de tu entrenador.
      </p>
    </div>
  </div>
</template>

<style scoped>
.workout-media {
  width: 100%;
  aspect-ratio: 4 / 3;
  max-height: min(42vh, 320px);
  border-radius: 16px;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.workout-media__frame {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 0;
  background: #000;
}

.workout-media__fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px 16px;
  text-align: center;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.03);
}

.workout-media__fallback-text {
  margin: 0;
  color: #8B929E;
  font-size: 0.9rem;
  line-height: 1.4;
  max-width: 100%;
  padding: 0 8px;
}

@media (min-width: 480px) {
  .workout-media {
    aspect-ratio: 16 / 10;
  }

  .workout-media__frame {
    object-fit: contain;
  }
}
</style>
