<script setup>
import ExerciseMuscleFilter from '../../../shared/components/ExerciseMuscleFilter.vue';
import { parseSecondaryMuscles } from '../../../shared/constants/muscles.js';
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
  muscleFilter: { type: String, default: null },
  onlyWarmup: { type: Boolean, default: false },
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
  'update:muscleFilter',
  'update:onlyWarmup',
  'edit',
  'assign',
  'delete',
  'prevPage',
  'nextPage',
]);

function secondaryLabel(item) {
  const list = parseSecondaryMuscles(item?.secondary_muscles);
  return list.length ? list.join(', ') : '';
}

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
    <header class="catalog-header mb-4">
      <div class="min-w-0">
        <h3 class="card-section-title mb-1">Catálogo</h3>
        <p class="catalog-header__meta mb-0">
          {{ exercises.length }} de {{ totalCount }} ejercicios
          <span v-if="exercises.length">
            · {{ globalCount }} globales · {{ privateCount }} tuyos
          </span>
          · pág. {{ currentPage }}/{{ totalPages }}
        </p>
      </div>
    </header>

    <div class="catalog-filters mb-4" role="search" aria-label="Filtros del catálogo">
      <v-text-field
        :model-value="searchQuery"
        placeholder="Buscar ejercicio…"
        density="compact"
        variant="outlined"
        hide-details
        clearable
        prepend-inner-icon="mdi-magnify"
        color="primary"
        class="catalog-filters__search"
        @update:model-value="$emit('update:searchQuery', $event ?? '')"
      />

      <div class="catalog-filters__chips" role="group" aria-label="Filtros rápidos">
        <v-btn
          size="small"
          :variant="onlyWarmup ? 'flat' : 'outlined'"
          :color="onlyWarmup ? 'warning' : undefined"
          class="catalog-filter-chip"
          prepend-icon="mdi-fire"
          :aria-pressed="onlyWarmup"
          @click="$emit('update:onlyWarmup', !onlyWarmup)"
        >
          Calentamiento
        </v-btn>
      </div>

      <ExerciseMuscleFilter
        class="catalog-filters__muscle"
        :model-value="muscleFilter"
        :only-warmup="false"
        :show-warmup="false"
        label="Músculo"
        @update:model-value="$emit('update:muscleFilter', $event)"
      />

      <p v-if="muscleFilter || onlyWarmup" class="catalog-filters__hint">
        <span v-if="muscleFilter">{{ muscleFilter }}</span>
        <span v-if="muscleFilter && onlyWarmup"> · </span>
        <span v-if="onlyWarmup">Calentamiento</span>
      </p>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <p v-else-if="exercises.length === 0" class="text-medium-emphasis mb-0">
      No hay ejercicios que coincidan. Crea uno a la izquierda o ajusta la búsqueda.
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
                Demo
              </v-chip>
              <v-chip
                v-if="item.is_warmup"
                size="x-small"
                color="warning"
                variant="tonal"
              >
                Calent.
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
          <div class="text-caption text-cyan mb-1">
            {{ displayExerciseMuscle(item) || 'Sin etiquetar' }}
          </div>
          <div
            v-if="secondaryLabel(item)"
            class="text-caption text-medium-emphasis mb-2"
          >
            + {{ secondaryLabel(item) }}
          </div>
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

          <div class="d-flex flex-wrap ga-1 mt-3">
            <v-btn
              size="small"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-plus"
              @click="$emit('assign', item)"
            >
              Añadir a…
            </v-btn>
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

.catalog-header__meta {
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.35;
}

.catalog-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.55rem 0.65rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.catalog-filters__search {
  grid-column: 1 / -1;
}

.catalog-filters__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.catalog-filter-chip {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
  border-radius: 999px;
}

.catalog-filters__muscle {
  min-width: 0;
}

.catalog-filters__hint {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.catalog-filters :deep(.v-field) {
  border-radius: 10px;
}

@media (min-width: 720px) {
  .catalog-filters {
    grid-template-columns: minmax(180px, 1.2fr) auto minmax(160px, 1fr);
    align-items: center;
  }

  .catalog-filters__search {
    grid-column: auto;
  }

  .catalog-filters__hint {
    grid-column: 1 / -1;
  }
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

@media (max-width: 600px) {
  .exercise-grid {
    grid-template-columns: 1fr;
  }
}

.min-w-0 {
  min-width: 0;
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
  color: var(--tf-on-surface-muted, #a8b0bc);
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
