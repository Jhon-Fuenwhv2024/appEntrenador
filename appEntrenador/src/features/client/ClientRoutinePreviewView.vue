<script setup>
/**
 * Feature 058 — Preview de solo lectura de la rutina del día (lista + media).
 * Soft-lock (Feature 040): se puede ver la rutina; Empezar queda bloqueado.
 */
import { computed, onMounted, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  getApiErrorMessage,
  isMembershipBlockedError,
} from '../../shared/api/http.js';
import { getSessionUser } from '../../shared/auth/session.js';
import { normalizeMembershipPeriod } from '../../shared/membership/period.js';
import { isRoutineScheduledForDate } from '../../shared/utils/weekdays.js';
import { getMyMembership } from './api/membershipApi.js';
import { getMyRoutines } from './api/routinesApi.js';
import ClientMembershipContactActions from './components/ClientMembershipContactActions.vue';
import MembershipLockedState from './components/MembershipLockedState.vue';
import WorkoutExerciseMedia from './components/WorkoutExerciseMedia.vue';
import WorkoutHintExpandable from './components/WorkoutHintExpandable.vue';
import { isMembershipAccessBlocked } from './utils/membershipUi.js';
import { prescriptionLabel as formatPrescription } from '../../shared/routines/setPrescription.js';

const route = useRoute();
const router = useRouter();

const loading = shallowRef(true);
const loadError = shallowRef('');
const membershipBlocked = shallowRef(false);
const routine = shallowRef(null);

const exercises = computed(() => (
  Array.isArray(routine.value?.ejercicios) ? routine.value.ejercicios : []
));

const exerciseCountLabel = computed(() => {
  const n = exercises.value.length;
  if (!n) return 'Sin ejercicios';
  return n === 1 ? '1 ejercicio' : `${n} ejercicios`;
});

/** Trainer-programmed weekday only — view anytime, start on that day. */
const canStartWorkout = computed(() => (
  Boolean(routine.value) && isRoutineScheduledForDate(routine.value)
));

const dayLockMessage = computed(() => {
  const day = routine.value?.dia_semana;
  if (!day) return '';
  return `Programada para ${day}. Hoy solo puedes verla; podrás empezar ese día.`;
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

function prescriptionLabel(ex) {
  return formatPrescription(ex);
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
      loadError.value = '';
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

    <MembershipLockedState
      v-else-if="membershipBlocked && !routine"
      title="Membresía pausada"
      message="Renueva con tu entrenador para volver a ver y entrenar tus rutinas."
      @back="goBack"
    />

    <v-alert
      v-else-if="loadError"
      type="error"
      variant="tonal"
      class="ma-4"
    >
      {{ loadError }}
      <template #append>
        <v-btn variant="text" @click="goBack">Volver</v-btn>
      </template>
    </v-alert>

    <main v-else-if="routine" class="preview-main">
      <div
        v-if="membershipBlocked"
        class="preview-lock"
        role="status"
      >
        <div class="preview-lock__copy">
          <p class="preview-lock__kicker">Membresía vencida</p>
          <p class="preview-lock__text">
            Puedes revisar la rutina, pero el entrenamiento está pausado.
          </p>
        </div>
        <ClientMembershipContactActions
          density="subtle"
          tone="danger"
          :enabled="true"
          note="Habla con tu entrenador para renovar"
          prefill-text="Hola, quiero renovar mi membresía en Trainfit."
          class="preview-lock__contact"
        />
      </div>

      <div
        v-else-if="!canStartWorkout"
        class="preview-lock preview-lock--day"
        role="status"
      >
        <div class="preview-lock__copy">
          <p class="preview-lock__kicker">Aún no es el día</p>
          <p class="preview-lock__text">{{ dayLockMessage }}</p>
        </div>
      </div>

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

          <WorkoutHintExpandable
            v-if="exerciseInfo(ex)"
            class="preview-card__hint-wrap"
            :text="exerciseInfo(ex)"
          />
        </li>
      </ol>

      <p v-if="!exercises.length" class="preview-empty">
        Esta rutina no tiene ejercicios asignados.
      </p>
    </main>

    <div
      v-if="routine"
      class="preview-footer"
    >
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
          v-else-if="!canStartWorkout"
          color="primary"
          variant="tonal"
          class="preview-cta font-weight-bold"
          rounded="lg"
          disabled
          prepend-icon="mdi-calendar-clock"
          :aria-label="dayLockMessage"
        >
          Disponible {{ routine.dia_semana }}
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
  </div>
</template>

<style scoped>
.preview-bg {
  box-sizing: border-box;
  height: 100%;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
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
  flex-shrink: 0;
  z-index: 2;
  background: #0b0d12;
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

.preview-back:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
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
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.preview-main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 0.5rem 1rem 1rem;
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.preview-lock {
  margin: 0 0 0.9rem;
  padding: 0.75rem 0.85rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 92, 92, 0.22);
  background:
    linear-gradient(135deg, rgba(255, 92, 92, 0.1) 0%, rgba(0, 229, 255, 0.03) 100%);
}

.preview-lock--day {
  border-color: rgba(0, 229, 255, 0.28);
  background:
    linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
}

.preview-lock--day .preview-lock__kicker {
  color: #00e5ff;
}

.preview-lock__kicker {
  margin: 0;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ff8a80;
}

.preview-lock__text {
  margin: 0.3rem 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--tf-on-surface, #e8eaed);
}

.preview-lock__contact {
  margin-top: 0.55rem;
}

.preview-lock__contact :deep(.mca--subtle) {
  margin-top: 0;
  padding: 0.45rem 0.55rem;
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
  overflow: hidden;
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
  color: var(--tf-on-surface-muted, #a8b0bc);
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
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 0 0 0.45rem;
}

.preview-card__media :deep(.workout-media) {
  max-height: min(36vh, 280px);
}

.preview-card__rest {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0.35rem 0 0;
  font-size: 0.72rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.preview-card__hint-wrap {
  margin-top: 0.45rem;
  margin-bottom: 0;
}

.preview-empty {
  margin: 1rem 0;
  font-size: 0.85rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  text-align: center;
}

.preview-footer {
  flex-shrink: 0;
  position: relative;
  left: auto;
  transform: none;
  bottom: auto;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent, #0b0d12 28%);
  z-index: 3;
  box-sizing: border-box;
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
