<script setup>
/**
 * Herramienta interna HITL: clasificar músculo principal/secundarios del catálogo.
 * Acceso: superadmin. Ruta: /admin/exercises/tagger
 *
 * Component map:
 * - ExerciseTaggerView: shell + estados (loading / complete / error)
 * - ExerciseTaggerMedia: render video/gif/imagen
 * - ExerciseTaggerControls: selección + Guardar y siguiente
 * - useExerciseTagger: fetch/save/reset
 */
import { computed } from 'vue';
import { getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import { displayExerciseName } from '../../shared/utils/exerciseDisplay.js';
import ExerciseTaggerControls from './components/ExerciseTaggerControls.vue';
import ExerciseTaggerMedia from './components/ExerciseTaggerMedia.vue';
import ExerciseTaggerProgress from './components/ExerciseTaggerProgress.vue';
import { useExerciseTagger } from './composables/useExerciseTagger.js';

const {
  MUSCLE_OPTIONS,
  loading,
  saving,
  errorMessage,
  exercise,
  catalogComplete,
  progress,
  selectedPrimary,
  selectedSecondary,
  isWarmup,
  secondaryOptions,
  canSave,
  selectPrimary,
  setIsWarmup,
  saveAndNext,
} = useExerciseTagger();

const shellRole = computed(() => {
  const user = getSessionUser();
  return user?.rol === 'client' ? 'client' : 'trainer';
});

const exerciseTitle = computed(() => (
  exercise.value ? displayExerciseName(exercise.value) : ''
));

function onSecondaryUpdate(value) {
  selectedSecondary.value = Array.isArray(value) ? value : [];
}
</script>

<template>
  <AppShell
    :role="shellRole"
    active="tagger"
  >
    <main class="main-content tagger-page">
      <header class="tagger-page__header">
        <div class="tagger-page__header-text">
          <p class="tagger-page__eyebrow">
            Herramienta interna
          </p>
          <h1 class="tagger-page__heading">
            Etiquetado de ejercicios
          </h1>
        </div>
        <ExerciseTaggerProgress
          :tagged="progress.tagged"
          :remaining="progress.remaining"
          :total="progress.total"
          :percent="progress.percent"
        />
        <h2
          v-if="exercise"
          class="tagger-page__title"
        >
          {{ exerciseTitle }}
        </h2>
      </header>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="tagger-page__alert mb-3"
        density="compact"
      >
        {{ errorMessage }}
      </v-alert>

      <div
        v-if="loading && !exercise"
        class="tagger-page__loading"
      >
        <v-progress-circular
          indeterminate
          color="primary"
          size="48"
        />
        <p>Cargando siguiente ejercicio…</p>
      </div>

      <div
        v-else-if="catalogComplete"
        class="tagger-page__complete"
        role="status"
      >
        <v-icon
          icon="mdi-check-decagram"
          size="72"
          color="success"
        />
        <p class="tagger-page__complete-banner">
          ¡Catálogo completado al 100%!
        </p>
        <p class="tagger-page__complete-sub">
          No quedan ejercicios sin músculo principal.
        </p>
      </div>

      <div
        v-else-if="exercise"
        class="tagger-page__workspace"
      >
        <ExerciseTaggerMedia
          :exercise="exercise"
          :title="exerciseTitle"
        />

        <ExerciseTaggerControls
          :muscle-options="MUSCLE_OPTIONS"
          :secondary-options="secondaryOptions"
          :selected-primary="selectedPrimary"
          :selected-secondary="selectedSecondary"
          :is-warmup="isWarmup"
          :can-save="canSave"
          :saving="saving"
          @select-primary="selectPrimary"
          @update:selected-secondary="onSecondaryUpdate"
          @update:is-warmup="setIsWarmup"
          @save="saveAndNext"
        />
      </div>
    </main>
  </AppShell>
</template>

<style scoped>
.tagger-page {
  max-width: 880px;
  margin: 0 auto;
  width: 100%;
  text-align: center;
}

.tagger-page__header {
  margin-bottom: 0.75rem;
}

.tagger-page__eyebrow {
  margin: 0 0 0.2rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.45);
}

.tagger-page__heading {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.72);
}

.tagger-page__title {
  margin: 0.5rem 0 0;
  font-size: clamp(1.15rem, 2.6vw, 1.55rem);
  font-weight: 700;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.96);
}

.tagger-page__alert {
  text-align: left;
}

.tagger-page__workspace {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding-bottom: 0.5rem;
}

.tagger-page__loading,
.tagger-page__complete {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 40vh;
  padding: 2rem 1rem;
}

.tagger-page__loading p {
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
}

.tagger-page__complete-banner {
  margin: 0;
  font-size: clamp(1.5rem, 4.5vw, 2.4rem);
  font-weight: 800;
  line-height: 1.15;
  color: rgb(var(--v-theme-success));
}

.tagger-page__complete-sub {
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 1rem;
}

@media (min-width: 960px) {
  .tagger-page__workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    align-items: start;
    gap: 1.25rem;
    text-align: left;
  }
}
</style>
