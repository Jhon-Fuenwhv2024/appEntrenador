<script setup>
/**
 * Historial de check-ins del alumno (vista entrenador).
 * Timeline + miniaturas con visor ampliado.
 */
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { resolveMediaSrc } from '../../../shared/utils/mediaUrl.js';
import { getClientCheckins, markCheckinReviewed } from '../api/checkinsApi.js';

const POSE_LABELS = {
  front: 'Frente',
  side: 'Perfil',
  back: 'Espalda',
};

const props = defineProps({
  clientId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['notify']);

const loading = shallowRef(false);
const loadError = shallowRef('');
const checkins = ref([]);
const viewerOpen = shallowRef(false);
const viewerSrc = shallowRef('');
const viewerCaption = shallowRef('');
const poseFilter = shallowRef('all');
const reviewingId = shallowRef(null);

const poseFilterItems = [
  { title: 'Todas las poses', value: 'all' },
  { title: 'Frente', value: 'front' },
  { title: 'Perfil', value: 'side' },
  { title: 'Espalda', value: 'back' },
];

function resolvePhotoSrc(imageUrl) {
  return resolveMediaSrc(imageUrl);
}

function formatDateLabel(isoDate) {
  if (!isoDate) return '—';
  const [y, m, d] = String(isoDate).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return String(isoDate);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function ratingColor(value, kind) {
  const n = Number(value) || 0;
  if (kind === 'stress') {
    if (n >= 4) return 'error';
    if (n >= 3) return 'warning';
    return 'success';
  }
  if (n >= 4) return 'success';
  if (n >= 3) return 'warning';
  return 'error';
}

const filteredCheckins = computed(() => {
  const filter = poseFilter.value;
  if (filter === 'all') return checkins.value;

  return checkins.value.map((c) => ({
    ...c,
    photos: (c.photos || []).filter((p) => p.pose_type === filter),
  }));
});

const emptyMessage = computed(() => {
  if (checkins.value.length === 0) {
    return 'Aún no hay check-ins de este alumno.';
  }
  if (poseFilter.value !== 'all') {
    const hasAny = filteredCheckins.value.some((c) => (c.photos || []).length > 0);
    if (!hasAny) return 'No hay fotos con esa pose en el historial.';
  }
  return '';
});

async function loadCheckins() {
  if (!props.clientId) return;
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getClientCheckins(props.clientId);
    checkins.value = response.data.data ?? [];
  } catch (error) {
    console.error('Error cargando check-ins:', error);
    const status = error?.response?.status || error?.normalized?.code;
    loadError.value = status === 404
      ? 'API de check-ins no disponible. Reinicia el backend (npm start).'
      : getApiErrorMessage(error, 'No se pudieron cargar los check-ins');
    checkins.value = [];
    emit('notify', { text: loadError.value, color: 'error' });
  } finally {
    loading.value = false;
  }
}

function openViewer(photo) {
  viewerSrc.value = resolvePhotoSrc(photo.image_url);
  viewerCaption.value = `${POSE_LABELS[photo.pose_type] || photo.pose_type} · ${formatDateLabel(photo.taken_at)}`;
  viewerOpen.value = true;
}

async function onMarkReviewed(item) {
  if (!item?.id || item.reviewed_at) return;
  try {
    reviewingId.value = item.id;
    const response = await markCheckinReviewed(item.id);
    const updated = response.data?.data;
    const idx = checkins.value.findIndex((c) => c.id === item.id);
    if (idx >= 0) {
      checkins.value[idx] = {
        ...checkins.value[idx],
        reviewed_at: updated?.reviewed_at ?? new Date().toISOString(),
      };
    }
    emit('notify', { text: 'Check-in marcado como revisado', color: 'success' });
  } catch (error) {
    console.error('Error marcando check-in:', error);
    emit('notify', {
      text: getApiErrorMessage(error, 'No se pudo marcar como revisado'),
      color: 'error',
    });
  } finally {
    reviewingId.value = null;
  }
}

watch(
  () => props.clientId,
  () => {
    loadCheckins();
  },
);

onMounted(loadCheckins);

defineExpose({ reload: loadCheckins });
</script>

<template>
  <section class="checkins-panel">
    <div class="checkins-panel__head">
      <div>
        <h2 class="checkins-panel__title">Check-ins</h2>
        <p class="checkins-panel__hint">Biofeedback semanal y fotos opcionales</p>
      </div>
      <v-select
        v-model="poseFilter"
        :items="poseFilterItems"
        item-title="title"
        item-value="value"
        density="compact"
        variant="outlined"
        hide-details
        color="primary"
        class="checkins-panel__filter"
        :menu-props="{ contentClass: 'tf-overlay-menu', maxHeight: 280 }"
        :list-props="{ bgColor: 'surface', color: undefined }"
      />
    </div>

    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      class="mb-3"
      height="2"
    />

    <v-alert
      v-else-if="loadError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ loadError }}
      <template #append>
        <v-btn variant="text" size="x-small" @click="loadCheckins">Reintentar</v-btn>
      </template>
    </v-alert>

    <p v-else-if="emptyMessage" class="checkins-panel__empty">
      {{ emptyMessage }}
    </p>

    <v-timeline
      v-else-if="filteredCheckins.length"
      side="end"
      density="compact"
      truncate-line="both"
      class="checkins-timeline"
    >
      <v-timeline-item
        v-for="item in filteredCheckins"
        :key="item.id"
        size="small"
        dot-color="primary"
      >
        <template #opposite>
          <span class="checkins-timeline__date">{{ formatDateLabel(item.created_at) }}</span>
        </template>

        <v-card class="checkin-card" color="surface" variant="tonal">
          <v-card-text class="py-3 px-3">
            <div class="checkin-card__top">
              <div class="checkin-metrics">
                <div class="checkin-chip">
                  <v-icon icon="mdi-sleep" size="14" />
                  Sueño
                  <v-chip
                    size="x-small"
                    :color="ratingColor(item.sleep_quality, 'sleep')"
                    variant="flat"
                  >
                    {{ item.sleep_quality }}/5
                  </v-chip>
                </div>
                <div class="checkin-chip">
                  <v-icon icon="mdi-head-heart-outline" size="14" />
                  Estrés
                  <v-chip
                    size="x-small"
                    :color="ratingColor(item.stress_level, 'stress')"
                    variant="flat"
                  >
                    {{ item.stress_level }}/5
                  </v-chip>
                </div>
                <div class="checkin-chip">
                  <v-icon icon="mdi-food-apple-outline" size="14" />
                  Dieta
                  <v-chip
                    size="x-small"
                    :color="ratingColor(item.diet_adherence, 'diet')"
                    variant="flat"
                  >
                    {{ item.diet_adherence }}/5
                  </v-chip>
                </div>
              </div>
              <v-chip
                v-if="item.reviewed_at"
                size="x-small"
                color="success"
                variant="tonal"
                prepend-icon="mdi-check"
              >
                Revisado
              </v-chip>
              <v-btn
                v-else
                size="x-small"
                color="primary"
                variant="tonal"
                :loading="reviewingId === item.id"
                prepend-icon="mdi-eye-check-outline"
                @click="onMarkReviewed(item)"
              >
                Marcar revisado
              </v-btn>
            </div>

            <p v-if="item.notes" class="checkin-notes">{{ item.notes }}</p>

            <div v-if="item.photos?.length" class="checkin-thumbs">
              <button
                v-for="photo in item.photos"
                :key="photo.id"
                type="button"
                class="checkin-thumb"
                :title="POSE_LABELS[photo.pose_type] || photo.pose_type"
                @click="openViewer(photo)"
              >
                <img
                  :src="resolvePhotoSrc(photo.image_url)"
                  :alt="POSE_LABELS[photo.pose_type] || photo.pose_type"
                  loading="lazy"
                >
                <span class="checkin-thumb__label">
                  {{ POSE_LABELS[photo.pose_type] || photo.pose_type }}
                </span>
              </button>
            </div>
          </v-card-text>
        </v-card>
      </v-timeline-item>
    </v-timeline>

    <v-dialog v-model="viewerOpen" max-width="720" scrim="rgba(0,0,0,0.75)">
      <v-card color="surface">
        <v-card-title class="text-body-1">{{ viewerCaption }}</v-card-title>
        <v-img
          v-if="viewerSrc"
          :src="viewerSrc"
          max-height="70vh"
          contain
        />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="viewerOpen = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<style scoped>
.checkins-panel__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.checkins-panel__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.checkins-panel__hint,
.checkins-panel__empty {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.checkins-panel__empty {
  margin-top: 0.5rem;
}

.checkins-panel__filter {
  max-width: 200px;
  min-width: 160px;
}

.checkins-timeline__date {
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  text-transform: capitalize;
}

.checkin-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.checkin-card__top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem 0.75rem;
}

.checkin-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.85rem;
  flex: 1 1 auto;
}

.checkin-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: #c5cad3;
}

.checkin-notes {
  margin: 0.65rem 0 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: #e8eaed;
  white-space: pre-wrap;
}

.checkin-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.checkin-thumb {
  position: relative;
  width: 72px;
  height: 72px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.35);
}

.checkin-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.checkin-thumb__label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.1rem 0.2rem;
  font-size: 0.6rem;
  text-align: center;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
}
</style>
