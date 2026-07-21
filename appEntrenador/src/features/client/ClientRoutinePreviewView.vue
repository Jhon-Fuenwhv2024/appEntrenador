<script setup>
/**
 * Feature 058 — Preview de solo lectura de la rutina del día (lista + media).
 * No inicia sesión de workout ni registra series.
 */
import { computed, onMounted, ref, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  getApiErrorMessage,
  isMembershipBlockedError,
} from '../../shared/api/http.js';
import { getSessionUser } from '../../shared/auth/session.js';
import { getMyMembership } from './api/membershipApi.js';
import { getMyRoutines } from './api/routinesApi.js';
import WorkoutExerciseMedia from './components/WorkoutExerciseMedia.vue';
import { isMembershipAccessBlocked } from './utils/membershipUi.js';
import { normalizeMembershipPeriod } from '../../shared/membership/period.js';

const MEMBERSHIP_BLOCKED_MSG = 'Tu membresía venció — habla con tu entrenador.';
const INFO_PREVIEW_CHARS = 15;

const route = useRoute();
const router = useRouter();

const loading = shallowRef(true);
const loadError = shallowRef('');
const membershipBlocked = shallowRef(false);
const routine = shallowRef(null);
/** Keys of exercises with full info expanded. */
const expandedInfoKeys = ref([]);

const exercises = computed(() => (
  Array.isArray(routine.value?.ejercicios) ? routine.value.ejercicios : []
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

function exerciseInfo(ex) {
  const hint = typeof ex?.indicaciones === 'string' ? ex.indicaciones.trim() : '';
  if (hint) return hint;
  const descEs = typeof ex?.description_es === 'string' ? ex.description_es.trim() : '';
  if (descEs) return descEs;
  return '';
}

function infoNeedsTruncate(text) {
  return text.length > INFO_PREVIEW_CHARS;
}

function isInfoExpanded(key) {
  return expandedInfoKeys.value.includes(key);
}

function toggleInfo(key) {
  if (isInfoExpanded(key)) {
    expandedInfoKeys.value = expandedInfoKeys.value.filter((k) => k !== key);
  } else {
    expandedInfoKeys.value = [...expandedInfoKeys.value, key];
  }
}

function displayInfo(ex, index) {
  const text = exerciseInfo(ex);
  if (!text) return '';
  const key = exerciseKey(ex, index);
  if (isInfoExpanded(key) || !infoNeedsTruncate(text)) return text;
  return `${text.slice(0, INFO_PREVIEW_CHARS)}...`;
}

function prescriptionLabel(ex) {
  const series = Number(ex?.series) || 0;
  const reps = Number(ex?.repeticiones) || 0;
  const parts = [];
  if (series) parts.push(`${series} series`);
  if (reps) parts.push(`${reps} reps`);
  if (ex?.peso != null && String(ex.peso).trim() !== '') {
    parts.push(`${ex.peso} kg`);
  }
  return parts.join(' · ') || 'Sin prescripción';
}

function restLabel(ex) {
  const sec = Number(ex?.rest_time_seconds);
  if (!Number.isFinite(sec) || sec <= 0) return null;
  if (sec < 60) return `Descanso ${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `Descanso ${m}m ${s}s` : `Descanso ${m}m`;
}

function goBack() {
  router.push('/dashboard');
}

async function loadMembershipFlag() {
  try {
    const response = await getMyMembership();
    const mem = normalizeMembershipPeriod(response.data?.data ?? null);
    membershipBlocked.value = isMembershipAccessBlocked(mem);
  } catch (error) {
    console.warn('No se pudo cargar membresía en preview:', error);
  }
}

async function loadRoutine() {
  try {
    loading.value = true;
    loadError.value = '';
    membershipBlocked.value = false;
    routine.value = null;
    expandedInfoKeys.value = [];

    const routineId = Number(route.params.routineId);
    const [routinesRes] = await Promise.all([
      getMyRoutines(),
      loadMembershipFlag(),
    ]);

    const list = routinesRes.data?.data ?? [];
    const found = list.find((item) => Number(item.id) === routineId);
    if (!found) {
      loadError.value = 'No encontramos esa rutina en tu plan.';
      return;
    }
    routine.value = found;
  } catch (error) {
    console.error('Error cargando preview de rutina:', error);
    if (isMembershipBlockedError(error)) {
      membershipBlocked.value = true;
      loadError.value = MEMBERSHIP_BLOCKED_MSG;
    } else {
      loadError.value = getApiErrorMessage(error, 'No se pudo cargar la rutina');
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'client') {
    router.push('/');
    return;
  }
  loadRoutine();
});
</script>

<template>
  <div class="preview-bg">
    <header class="preview-top">
      <button type="button" class="preview-back" aria-label="Volver" @click="goBack">
        <v-icon icon="mdi-arrow-left" size="22" />
      </button>
      <div class="preview-top-text">
        <p class="preview-eyebrow">Ver rutina</p>
        <h1 class="preview-routine">
          {{ routine?.nombre_rutina || 'Tu rutina' }}
        </h1>
        <p v-if="routine" class="preview-meta">
          <span v-if="routine.dia_semana">{{ routine.dia_semana }}</span>
          <span v-if="routine.dia_semana"> · </span>
          {{ exerciseCountLabel }}
        </p>
      </div>
    </header>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mx-4" />

    <v-alert
      v-else-if="loadError"
      type="error"
      variant="tonal"
      class="ma-4"
      :prepend-icon="membershipBlocked ? 'mdi-lock' : undefined"
    >
      {{ loadError }}
      <template #append>
        <v-btn variant="text" @click="goBack">Volver</v-btn>
      </template>
    </v-alert>

    <main v-else-if="routine" class="preview-main">
      <p class="preview-lead">
        Revisa los ejercicios y las demos antes de empezar. Esta vista no registra series.
      </p>

      <ol class="preview-list" aria-label="Ejercicios de la rutina">
        <li
          v-for="(ex, index) in exercises"
          :key="exerciseKey(ex, index)"
          class="preview-card"
        >
          <div class="preview-card__head">
            <span class="preview-card__index">{{ index + 1 }}</span>
            <div class="preview-card__titles">
              <h2 class="preview-card__name">{{ exerciseTitle(ex) }}</h2>
              <p class="preview-card__rx">{{ prescriptionLabel(ex) }}</p>
            </div>
            <span
              v-if="ex.superset_letter"
              class="preview-card__ss"
              :title="`Superserie ${ex.superset_letter}`"
            >
              {{ ex.superset_letter }}
            </span>
          </div>

          <WorkoutExerciseMedia
            class="preview-card__media"
            :media-type="ex.media_type"
            :media-url="ex.media_url"
            :local-media-path="ex.local_media_path"
            :exercise-name="exerciseTitle(ex)"
          />

          <p v-if="restLabel(ex)" class="preview-card__rest">
            <v-icon icon="mdi-timer-outline" size="14" />
            {{ restLabel(ex) }}
          </p>

          <div v-if="exerciseInfo(ex)" class="preview-card__info">
            <p class="preview-card__hint">
              {{ displayInfo(ex, index) }}
            </p>
            <button
              v-if="infoNeedsTruncate(exerciseInfo(ex))"
              type="button"
              class="preview-card__more"
              @click="toggleInfo(exerciseKey(ex, index))"
            >
              {{ isInfoExpanded(exerciseKey(ex, index)) ? 'ver menos' : 'ver más' }}
            </button>
          </div>
        </li>
      </ol>

      <p v-if="!exercises.length" class="preview-empty">
        Esta rutina no tiene ejercicios asignados.
      </p>

      <div class="preview-footer">
        <div class="preview-footer__row">
          <v-btn
            color="primary"
            variant="outlined"
            class="preview-cta preview-cta--secondary font-weight-bold"
            rounded="lg"
            @click="goBack"
          >
            Volver
          </v-btn>
          <v-btn
            v-if="membershipBlocked"
            color="error"
            variant="tonal"
            class="preview-cta font-weight-bold"
            rounded="lg"
            disabled
            prepend-icon="mdi-lock"
          >
            Bloqueado
          </v-btn>
          <v-btn
            v-else
            color="primary"
            class="preview-cta font-weight-bold"
            rounded="lg"
            elevation="6"
            prepend-icon="mdi-play"
            :to="{ name: 'WorkoutPlayer', params: { routineId: routine.id } }"
          >
            Empezar
          </v-btn>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.preview-bg {
  min-height: 100dvh;
  background:
    radial-gradient(120% 70% at 50% -10%, rgba(0, 229, 255, 0.12), transparent 55%),
    #0b0d12;
  color: #f2f4f7;
  display: flex;
  flex-direction: column;
}

.preview-top {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.85rem 1rem 0.5rem;
  position: sticky;
  top: 0;
  z-index: 2;
  background: linear-gradient(180deg, #0b0d12 70%, transparent);
}

.preview-back {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: #f2f4f7;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.preview-back:hover {
  background: rgba(0, 229, 255, 0.12);
}

.preview-top-text {
  min-width: 0;
  flex: 1;
  padding-top: 0.15rem;
}

.preview-eyebrow {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #00e5ff;
}

.preview-routine {
  margin: 0.1rem 0 0;
  font-size: 1.2rem;
  font-weight: 750;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.preview-meta {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: #8b929e;
}

.preview-main {
  flex: 1;
  padding: 0.5rem 1rem 5.5rem;
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
}

.preview-lead {
  margin: 0 0 0.85rem;
  font-size: 0.8rem;
  color: #8b929e;
  line-height: 1.4;
}

.preview-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.preview-card {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.03);
  padding: 0.75rem;
}

.preview-card__head {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin-bottom: 0.55rem;
}

.preview-card__index {
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 750;
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
}

.preview-card__titles {
  min-width: 0;
  flex: 1;
}

.preview-card__name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.25;
}

.preview-card__rx {
  margin: 0.15rem 0 0;
  font-size: 0.72rem;
  color: #8b929e;
}

.preview-card__ss {
  flex-shrink: 0;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.35rem;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 750;
  color: #00e5ff;
  border: 1px solid rgba(0, 229, 255, 0.4);
  background: rgba(0, 229, 255, 0.1);
}

.preview-card__media {
  margin-bottom: 0.45rem;
}

.preview-card__rest {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0.35rem 0 0;
  font-size: 0.72rem;
  color: #8b929e;
}

.preview-card__info {
  margin-top: 0.35rem;
}

.preview-card__hint {
  margin: 0;
  font-size: 0.75rem;
  color: #c5cad3;
  line-height: 1.35;
  word-break: break-word;
}

.preview-card__more {
  margin: 0.2rem 0 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #00e5ff;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.preview-card__more:hover {
  color: #5ef0ff;
}

.preview-empty {
  margin: 1rem 0;
  font-size: 0.85rem;
  color: #8b929e;
  text-align: center;
}

.preview-footer {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: min(100%, 560px);
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent, #0b0d12 28%);
  z-index: 3;
}

.preview-footer__row {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.preview-cta {
  flex: 1 1 0;
  min-height: 48px !important;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.preview-cta--secondary {
  flex: 1 1 0;
}
</style>
