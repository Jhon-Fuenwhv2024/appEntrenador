<script setup>
import {
  displayExerciseDescription,
  displayExerciseMuscle,
  displayExerciseName,
  getExerciseMediaKind,
  resolveExerciseMediaSrc,
} from '../../../shared/utils/exerciseDisplay.js';

defineProps({
  exercises: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
  onlyEnriched: { type: Boolean, default: false },
  totalCount: { type: Number, default: 0 },
  pageSize: { type: Number, default: 6 },
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  canGoPrev: { type: Boolean, default: false },
  canGoNext: { type: Boolean, default: false },
  globalCount: { type: Number, default: 0 },
  privateCount: { type: Number, default: 0 },
  editingId: { type: Number, default: null },
});

defineEmits([
  'update:searchQuery',
  'update:onlyEnriched',
  'edit',
  'delete',
  'prevPage',
  'nextPage',
]);

function mediaSrc(item) {
  return resolveExerciseMediaSrc(item);
}

function mediaKind(item) {
  return getExerciseMediaKind(mediaSrc(item), item?.media_type);
}

function hasMedia(item) {
  const kind = mediaKind(item);
  return kind === 'video' || kind === 'gif' || kind === 'image' || kind === 'youtube';
}

function mediaLabel(item) {
  const kind = mediaKind(item);
  if (kind === 'youtube' || kind === 'video') return 'Ver video';
  if (kind === 'gif') return 'Ver GIF';
  if (kind === 'image') return 'Ver imagen';
  return 'Ver media';
}

function hasSpanish(item) {
  return Boolean(item?.name_es?.trim());
}

function hasLocalMedia(item) {
  return Boolean(item?.local_media_path?.trim());
}
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
      <div>
        <h3 class="card-section-title mb-1">Catálogo</h3>
        <p class="text-caption text-medium-emphasis mb-0">
          Mostrando {{ exercises.length }} de {{ totalCount }} ejercicios
          <span v-if="exercises.length">
            · {{ globalCount }} globales · {{ privateCount }} tuyos (en esta página)
          </span>
        </p>
        <p class="text-caption text-medium-emphasis mb-0 mt-1">
          Página {{ currentPage }} de {{ totalPages }}
          <span v-if="onlyEnriched"> · filtro ES / media local</span>
        </p>
      </div>
      <div class="catalog-toolbar">
        <v-switch
          :model-value="onlyEnriched"
          color="primary"
          density="compact"
          hide-details
          inset
          label="Solo ES / media local"
          class="enriched-switch"
          @update:model-value="$emit('update:onlyEnriched', Boolean($event))"
        />
        <v-text-field
          :model-value="searchQuery"
          label="Buscar"
          density="compact"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          class="search-field"
          @update:model-value="$emit('update:searchQuery', $event ?? '')"
        />
      </div>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <p v-else-if="exercises.length === 0" class="text-medium-emphasis mb-0">
      <template v-if="onlyEnriched">
        No hay ejercicios enriquecidos (name_es / media local). ¿Reiniciaste el backend tras el scrape?
      </template>
      <template v-else>
        No hay ejercicios que coincidan. Crea uno a la izquierda o ajusta la búsqueda.
      </template>
    </p>

    <template v-else>
      <div class="exercise-grid">
        <article
          v-for="item in exercises"
          :key="item.id"
          class="exercise-card"
          :class="{ 'exercise-card--editing': editingId === item.id }"
        >
          <div class="d-flex justify-space-between align-start ga-2 mb-2">
            <h4 class="exercise-card-title">{{ displayExerciseName(item) }}</h4>
            <div class="d-flex flex-wrap justify-end ga-1">
              <v-chip
                v-if="hasSpanish(item)"
                size="x-small"
                color="success"
                variant="tonal"
              >
                ES
              </v-chip>
              <v-chip
                v-if="hasLocalMedia(item)"
                size="x-small"
                color="primary"
                variant="tonal"
              >
                Local
              </v-chip>
              <v-chip
                size="x-small"
                :color="item.is_global ? 'cyan' : 'orange'"
                variant="tonal"
              >
                {{ item.is_global ? 'Global' : 'Mío' }}
              </v-chip>
            </div>
          </div>
          <div class="text-caption text-cyan mb-2">{{ displayExerciseMuscle(item) }}</div>
          <p
            v-if="displayExerciseDescription(item)"
            class="exercise-card-desc"
          >
            {{ displayExerciseDescription(item) }}
          </p>
          <p
            v-if="item.name_es && item.name && item.name_es !== item.name"
            class="text-caption text-medium-emphasis mt-1 mb-0"
          >
            EN: {{ item.name }}
          </p>

          <div v-if="hasMedia(item)" class="exercise-media">
            <video
              v-if="mediaKind(item) === 'video'"
              class="exercise-media-thumb w-100"
              :src="mediaSrc(item)"
              autoplay
              loop
              muted
              playsinline
            />
            <img
              v-else-if="mediaKind(item) === 'gif' || mediaKind(item) === 'image'"
              class="exercise-media-thumb w-100"
              :src="mediaSrc(item)"
              :alt="displayExerciseName(item)"
              loading="lazy"
            />
            <a
              class="exercise-media-btn"
              :href="mediaSrc(item)"
              target="_blank"
              rel="noopener noreferrer"
            >
              <v-icon
                :icon="mediaKind(item) === 'youtube' || mediaKind(item) === 'video'
                  ? 'mdi-play-circle-outline'
                  : 'mdi-image-outline'"
                size="18"
              />
              {{ mediaLabel(item) }}
            </a>
          </div>

          <div class="d-flex ga-1 mt-3">
            <v-btn
              size="small"
              variant="text"
              color="primary"
              @click="$emit('edit', item)"
            >
              Editar
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              color="error"
              @click="$emit('delete', item)"
            >
              Borrar
            </v-btn>
          </div>
        </article>
      </div>

      <div
        v-if="totalPages > 1"
        class="d-flex flex-wrap align-center justify-center ga-3 mt-4"
      >
        <v-btn
          variant="outlined"
          color="primary"
          :disabled="!canGoPrev || loading"
          prepend-icon="mdi-chevron-left"
          @click="$emit('prevPage')"
        >
          Anterior
        </v-btn>
        <span class="text-caption text-medium-emphasis">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <v-btn
          variant="outlined"
          color="primary"
          :disabled="!canGoNext || loading"
          append-icon="mdi-chevron-right"
          @click="$emit('nextPage')"
        >
          Siguiente
        </v-btn>
      </div>
    </template>
  </div>
</template>

<style scoped>
.card-section-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.catalog-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  min-width: min(100%, 320px);
}

.enriched-switch {
  flex: 0 0 auto;
}

.search-field {
  max-width: 280px;
  min-width: 200px;
  width: 100%;
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

@media (max-width: 600px) {
  .search-field {
    max-width: none;
    min-width: 0;
  }

  .exercise-grid {
    grid-template-columns: 1fr;
  }
}

.exercise-card {
  padding: 1rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.exercise-card--editing {
  border-color: rgba(0, 229, 255, 0.45);
}

.exercise-card-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
}

.exercise-card-desc {
  margin: 0;
  font-size: 0.8rem;
  color: #8b929e;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.exercise-media {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.exercise-media-thumb {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.exercise-media-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  align-self: flex-start;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #00e5ff;
  text-decoration: none;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.28);
}

.exercise-media-btn:hover {
  background: rgba(0, 229, 255, 0.18);
}
</style>
