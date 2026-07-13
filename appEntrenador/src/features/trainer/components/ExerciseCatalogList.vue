<script setup>
defineProps({
  exercises: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
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

defineEmits(['update:searchQuery', 'edit', 'delete', 'prevPage', 'nextPage']);

function isVisualMedia(item) {
  const type = (item?.media_type || '').toLowerCase();
  return type === 'image' || type === 'gif';
}

function hasMedia(item) {
  const type = (item?.media_type || 'none').toLowerCase();
  return type !== 'none' && Boolean(item?.media_url);
}

function mediaLabel(item) {
  const type = (item?.media_type || '').toLowerCase();
  if (type === 'youtube') return 'Ver video';
  if (type === 'video') return 'Ver video';
  if (type === 'gif') return 'Ver GIF';
  if (type === 'image') return 'Ver imagen';
  return 'Ver media';
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
        </p>
      </div>
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

    <v-progress-linear v-if="loading" indeterminate color="#00E5FF" class="mb-4" />

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
            <h4 class="exercise-card-title">{{ item.name }}</h4>
            <v-chip
              size="x-small"
              :color="item.is_global ? 'cyan' : 'orange'"
              variant="tonal"
            >
              {{ item.is_global ? 'Global' : 'Mío' }}
            </v-chip>
          </div>
          <div class="text-caption text-cyan mb-2">{{ item.target_muscle }}</div>
          <p v-if="item.description" class="exercise-card-desc">
            {{ item.description }}
          </p>

          <div v-if="hasMedia(item)" class="exercise-media">
            <img
              v-if="isVisualMedia(item)"
              class="exercise-media-thumb"
              :src="item.media_url"
              :alt="item.name"
              loading="lazy"
            />
            <a
              class="exercise-media-btn"
              :href="item.media_url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <v-icon
                :icon="item.media_type === 'youtube' || item.media_type === 'video'
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
              color="#00E5FF"
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
          color="#00E5FF"
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
          color="#00E5FF"
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

.search-field {
  max-width: 280px;
  min-width: 200px;
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
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
