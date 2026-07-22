<script setup>
import { computed, onMounted, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  getApiErrorMessage,
  isMembershipBlockedError,
} from '../../shared/api/http.js';
import { getSessionUser } from '../../shared/auth/session.js';
import { getMyRoutines } from './api/routinesApi.js';
import { createMyWorkoutSession } from './api/workoutSessionsApi.js';
import { useWorkoutSession } from './composables/useWorkoutSession.js';
import PrCelebrationOverlay from './components/PrCelebrationOverlay.vue';
import WorkoutExerciseMedia from './components/WorkoutExerciseMedia.vue';
import WorkoutFinishedSummary from './components/WorkoutFinishedSummary.vue';
import WorkoutHintExpandable from './components/WorkoutHintExpandable.vue';
import WorkoutRestRing from './components/WorkoutRestRing.vue';
import WorkoutSetsChecklist from './components/WorkoutSetsChecklist.vue';

const MEMBERSHIP_BLOCKED_MSG = 'Tu membresía venció — habla con tu entrenador.';

const route = useRoute();
const router = useRouter();

const loading = shallowRef(true);
const loadError = shallowRef('');
const membershipBlocked = shallowRef(false);
const saveError = shallowRef('');
const saving = shallowRef(false);
const saved = shallowRef(false);
const formError = shallowRef('');
const sessionRoutineName = shallowRef('');
/** Routine payload kept until the user taps "Comenzar entrenamiento" (audio unlock). */
const pendingRoutine = shallowRef(null);
const newPrs = shallowRef([]);
const showPrCelebration = shallowRef(false);
const streakMessage = shallowRef('');

const {
  phase,
  restFormattedTime,
  restProgress,
  actualWeight,
  actualReps,
  logs,
  startedAt,
  sessionElapsedFormatted,
  currentExercise,
  exerciseIndex,
  totalExercises,
  progressLabel,
  restDuration,
  currentSupersetGroup,
  exercises,
  currentSetNumber,
  setsChecklist,
  nextExercisePreview,
  start,
  completeSet,
  skipRest,
  adjustRest,
  unlockAudio,
} = useWorkoutSession();

const exerciseHint = computed(() => (
  currentExercise.value?.indicaciones?.trim() || ''
));

const exerciseCounter = computed(() => {
  if (!totalExercises.value) return '';
  return `Ejercicio ${exerciseIndex.value + 1} de ${totalExercises.value}`;
});

/** Global progress 0–100 across exercises (Feature 059). */
const globalProgressPct = computed(() => {
  const total = totalExercises.value;
  if (!total) return 0;
  if (phase.value === 'finished') return 100;
  return Math.min(100, Math.round(((exerciseIndex.value) / total) * 100));
});

const showSessionClock = computed(() => (
  phase.value === 'working' || phase.value === 'resting'
));

/** Unique exercises logged this session (finish summary). */
const finishedExercisesCount = computed(() => {
  const names = new Set();
  for (const entry of logs.value) {
    const key = entry.exerciseId != null
      ? `id:${entry.exerciseId}`
      : `name:${entry.exerciseName || ''}`;
    names.add(key);
  }
  return names.size;
});

/** Total volume = Σ (weight × reps). */
const finishedVolumeKg = computed(() => (
  logs.value.reduce((sum, entry) => {
    const w = Number(entry.weight) || 0;
    const r = Number(entry.reps) || 0;
    return sum + (w * r);
  }, 0)
));

const isInSupersetGroup = computed(() => {
  const group = currentSupersetGroup.value;
  return group?.letter != null && group.end > group.start;
});

/** Members of the contiguous superseries for the group card. */
const supersetGroupMembers = computed(() => {
  if (!isInSupersetGroup.value) return [];
  const { start: groupStart, end: groupEnd, letter } = currentSupersetGroup.value;
  const list = exercises.value;
  const members = [];
  for (let i = groupStart; i <= groupEnd; i += 1) {
    const ex = list[i];
    if (!ex) continue;
    members.push({
      index: i,
      nombre: ex.nombre,
      letter,
      series: Number(ex.series) || 0,
      active: i === exerciseIndex.value,
    });
  }
  return members;
});

async function persistSession() {
  if (saved.value || saving.value) return;
  try {
    saving.value = true;
    saveError.value = '';
    const response = await createMyWorkoutSession({
      routine_id: Number(route.params.routineId),
      routine_name: sessionRoutineName.value,
      started_at: startedAt.value,
      status: 'completed',
      sets: logs.value.map((entry) => ({
        exercise_id: entry.exerciseId,
        exercise_name: entry.exerciseName,
        set_number: entry.setNumber,
        weight: entry.weight,
        reps: entry.reps,
      })),
    });
    const payload = response.data?.data ?? {};
    const prs = Array.isArray(payload.new_prs) ? payload.new_prs : [];
    newPrs.value = prs;
    if (prs.length > 0) {
      showPrCelebration.value = true;
    }
    const streak = Number(payload.consistency?.current_streak) || 0;
    if (streak > 0 && prs.length === 0) {
      streakMessage.value = `Racha: ${streak} día${streak === 1 ? '' : 's'} consecutivos`;
    }
    saved.value = true;
  } catch (error) {
    console.error('Error guardando sesión de entrenamiento:', error);
    if (isMembershipBlockedError(error)) {
      membershipBlocked.value = true;
      saveError.value = MEMBERSHIP_BLOCKED_MSG;
    } else {
      saveError.value = getApiErrorMessage(error, 'No se pudo guardar el entrenamiento');
    }
  } finally {
    saving.value = false;
  }
}

async function loadRoutine() {
  try {
    loading.value = true;
    loadError.value = '';
    membershipBlocked.value = false;
    pendingRoutine.value = null;
    const routineId = Number(route.params.routineId);
    const response = await getMyRoutines();
    const list = response.data.data ?? [];
    const routine = list.find((item) => Number(item.id) === routineId);
    if (!routine) {
      loadError.value = 'No encontramos esa rutina en tu plan.';
      return;
    }
    sessionRoutineName.value = routine.nombre_rutina || '';
    pendingRoutine.value = routine;
  } catch (error) {
    console.error('Error cargando rutina para el player:', error);
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

/**
 * First user gesture: unlock HTMLAudioElement (autoplay policy) then start session.
 */
function onBeginWorkout() {
  if (!pendingRoutine.value) return;
  unlockAudio();
  start(pendingRoutine.value);
  pendingRoutine.value = null;
}

function onCompleteSet() {
  formError.value = '';
  try {
    completeSet({
      weight: actualWeight.value,
      reps: actualReps.value,
    });
  } catch (error) {
    formError.value = error.message || 'Revisa peso y repeticiones.';
  }
}

function goBack() {
  router.push('/dashboard');
}

watch(phase, async (next) => {
  if (next === 'finished') {
    await persistSession();
  }
});

watch(currentExercise, () => {
  formError.value = '';
});

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
  <div class="player-bg">
    <header class="player-top">
      <button type="button" class="player-back" aria-label="Volver" @click="goBack">
        <v-icon icon="mdi-arrow-left" size="22" />
      </button>
      <div class="player-top-text">
        <div class="player-eyebrow">Entrenando</div>
        <div v-if="sessionRoutineName" class="player-routine">{{ sessionRoutineName }}</div>
      </div>
      <div
        v-if="showSessionClock"
        class="player-elapsed"
        aria-label="Duración de la sesión"
      >
        {{ sessionElapsedFormatted }}
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

    <main
      v-else-if="phase === 'idle' && pendingRoutine"
      class="player-main player-main--ready"
    >
      <p class="player-step">Listo</p>
      <h1 class="player-title">{{ sessionRoutineName || 'Tu rutina' }}</h1>
      <button type="button" class="player-cta player-cta--ready" @click="onBeginWorkout">
        Comenzar entrenamiento
      </button>
    </main>

    <main v-else-if="phase === 'working' && currentExercise" class="player-main">
      <div class="player-scroll">
        <p class="player-step">{{ exerciseCounter }}</p>
        <div
          class="player-progress"
          role="progressbar"
          :aria-valuenow="globalProgressPct"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="exerciseCounter"
        >
          <div
            class="player-progress__bar"
            :style="{ width: `${globalProgressPct}%` }"
          />
        </div>

        <v-card
          v-if="isInSupersetGroup"
          class="player-superset-card mb-3"
          bg-color="surface"
          variant="outlined"
        >
          <v-card-title class="player-superset-card__title text-subtitle-2">
            Superserie {{ currentSupersetGroup.letter }}
            · Serie {{ currentSetNumber }}
          </v-card-title>
          <v-card-text class="pt-0 pb-3">
            <ul class="player-superset-list">
              <li
                v-for="member in supersetGroupMembers"
                :key="member.index"
                class="player-superset-list__item"
                :class="{ 'player-superset-list__item--active': member.active }"
              >
                <span class="player-superset-list__badge">{{ member.letter }}</span>
                <span class="player-superset-list__name">{{ member.nombre }}</span>
                <span class="player-superset-list__sets">
                  {{ currentSetNumber }}/{{ member.series }}
                </span>
              </li>
            </ul>
          </v-card-text>
        </v-card>

        <h1 class="player-title">{{ currentExercise.nombre }}</h1>
        <p class="player-set">{{ progressLabel }}</p>

        <WorkoutExerciseMedia
          class="player-media"
          :media-type="currentExercise.media_type"
          :media-url="currentExercise.media_url"
          :local-media-path="currentExercise.local_media_path"
          :exercise-name="currentExercise.name_es || currentExercise.nombre"
        />

        <WorkoutHintExpandable :text="exerciseHint" />

        <WorkoutSetsChecklist
          v-model:weight="actualWeight"
          v-model:reps="actualReps"
          :rows="setsChecklist"
          :form-error="formError"
        />
      </div>

      <div class="player-footer">
        <button type="button" class="player-cta" @click="onCompleteSet">
          Completar serie
        </button>
      </div>
    </main>

    <main v-else-if="phase === 'resting'" class="player-main player-main--rest">
      <WorkoutRestRing
        :formatted-time="restFormattedTime"
        :progress="restProgress"
        :rest-duration="restDuration"
        :next-preview="nextExercisePreview"
        @adjust="adjustRest"
        @skip="skipRest"
      />
    </main>

    <main v-else-if="phase === 'finished'" class="player-main player-main--done">
      <WorkoutFinishedSummary
        :routine-name="sessionRoutineName"
        :duration-label="sessionElapsedFormatted"
        :sets-count="logs.length"
        :exercises-count="finishedExercisesCount"
        :volume-kg="finishedVolumeKg"
        :saving="saving"
        :saved="saved"
        :save-error="saveError"
        :streak-message="streakMessage"
        @retry="persistSession"
        @done="goBack"
      />
    </main>

    <PrCelebrationOverlay v-model="showPrCelebration" :prs="newPrs" />
  </div>
</template>

<style scoped>
.player-bg {
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  background: #0B0D12;
  color: #fff;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', system-ui, sans-serif;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-top: env(safe-area-inset-top, 0px);
}

.player-bg *,
.player-bg *::before,
.player-bg *::after {
  box-sizing: border-box;
}

.player-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 8px;
  flex-shrink: 0;
}

.player-back {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
}

.player-top-text {
  min-width: 0;
  flex: 1;
}

.player-eyebrow {
  font-size: 0.75rem;
  color: #00E5FF;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.player-routine {
  font-size: 0.95rem;
  color: #C5CAD3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-elapsed {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 0.95rem;
  color: #00E5FF;
  letter-spacing: 0.02em;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.2);
}

.player-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 0;
}

.player-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 4px 16px 12px;
}

.player-main--rest,
.player-main--done,
.player-main--ready {
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 16px;
}

.player-main--done {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  justify-content: flex-start;
  padding-top: 24px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}

.player-main--rest {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.player-cta--ready {
  margin-top: 28px;
}

.player-step {
  margin: 0 0 4px;
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-size: 0.85rem;
}

.player-progress {
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 0 12px;
  overflow: hidden;
}

.player-progress__bar {
  height: 100%;
  border-radius: inherit;
  background: #00E5FF;
  transition: width 0.25s ease;
}

.player-title {
  margin: 0 0 6px;
  font-size: clamp(1.35rem, 6vw, 1.85rem);
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
  word-break: break-word;
  max-width: 100%;
}

.player-set {
  margin: 0 0 12px;
  color: #00E5FF;
  font-weight: 600;
  font-size: 0.95rem;
}

.player-superset-card {
  border-left: 3px solid #00E5FF !important;
  border-color: rgba(0, 229, 255, 0.35) !important;
}

.player-superset-card__title {
  color: #00E5FF;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding-bottom: 4px;
}

.player-superset-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.player-superset-list__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-size: 0.9rem;
}

.player-superset-list__item--active {
  background: rgba(0, 229, 255, 0.1);
  color: #fff;
}

.player-superset-list__badge {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(0, 229, 255, 0.15);
  color: #00E5FF;
}

.player-superset-list__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-superset-list__sets {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  font-size: 0.8rem;
  opacity: 0.85;
}

.player-media {
  margin: 0 0 14px;
  width: 100%;
  max-width: 100%;
  border-radius: 16px;
}

.player-footer {
  flex-shrink: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(180deg, transparent, #0B0D12 28%);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.player-cta {
  /* Feature 038 — CTA touch-friendly (Mobile-First); color = on-primary */
  min-height: 64px;
  height: 64px;
  border: 0;
  border-radius: 16px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 8px 24px rgba(0, 229, 255, 0.22);
}

@media (min-width: 480px) {
  .player-scroll {
    padding: 8px 20px 16px;
  }

  .player-media {
    margin-bottom: 16px;
  }

  .player-footer {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>
