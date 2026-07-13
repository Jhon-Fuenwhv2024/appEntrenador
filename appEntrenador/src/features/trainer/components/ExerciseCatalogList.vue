<script setup>
defineProps({
  exercises: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
  globalCount: { type: Number, default: 0 },
  privateCount: { type: Number, default: 0 },
  editingId: { type: Number, default: null },
});

defineEmits(['update:searchQuery', 'edit', 'delete']);
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
      <div>
        <h3 class="card-section-title mb-1">Catálogo</h3>
        <p class="text-caption text-medium-emphasis mb-0">
          {{ globalCount }} globales · {{ privateCount }} tuyos
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

    <div v-else class="exercise-grid">
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
        <div v-if="item.media_type && item.media_type !== 'none'" class="text-caption text-medium-emphasis mt-2">
          Media: {{ item.media_type }}
          <a
            v-if="item.media_url"
            :href="item.media_url"
            target="_blank"
            rel="noopener noreferrer"
            class="media-link"
          >
            · ver enlace
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

.media-link {
  color: #00e5ff;
  text-decoration: none;
}
</style>
