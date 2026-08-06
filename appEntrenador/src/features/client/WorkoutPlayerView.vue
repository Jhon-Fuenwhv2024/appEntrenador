<script setup>
import { computed, onMounted, reactive, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  getApiErrorMessage,
  isMembershipBlockedError,
} from '../../shared/api/http.js';
import { getSessionUser } from '../../shared/auth/session.js';
import { normalizeMembershipPeriod } from '../../shared/membership/period.js';
import { formatLocalDate, todayLocalDate } from '../../shared/utils/localDate.js';
import { isRoutineScheduledForDate } from '../../shared/utils/weekdays.js';
import { getMyMembership } from './api/membershipApi.js';
import { getMyRoutines } from './api/routinesApi.js';
import { createMyWorkoutSession, getMyWorkoutSessions } from './api/workoutSessionsApi.js';
import {
  isNetworkError,
  useOfflineWorkoutSync,
} from './composables/useOfflineWorkoutSync.js';
import { useActiveWorkoutRecovery } from './composables/useActiveWorkoutRecovery.js';
import { useWakeLock } from './composables/useWakeLock.js';
import { useWorkoutSession } from './composables/useWorkoutSession.js';
import { enqueueWorkoutSession } from './utils/offlineWorkoutQueue.js';
import {
  clearActiveWorkoutDraft,
  getActiveWorkoutDraft,
} from './utils/activeWorkoutDraft.js';
import MembershipLockedState from './components/MembershipLockedState.vue';
import NextExerciseTechSheetDialog from './components/NextExerciseTechSheetDialog.vue';
import PrCelebrationOverlay from './components/PrCelebrationOverlay.vue';
import WorkoutExerciseMedia from './components/WorkoutExerciseMedia.vue';
import WorkoutFinishedSummary from './components/WorkoutFinishedSummary.vue';
import WorkoutHintExpandable from './components/WorkoutHintExpandable.vue';
import WorkoutRecoveryDialog from './components/WorkoutRecoveryDialog.vue';
import WorkoutRestRing from './components/WorkoutRestRing.vue';
import WorkoutSetsChecklist from './components/WorkoutSetsChecklist.vue';
import ConfirmActionDialog from '../../shared/components/ConfirmActionDialog.vue';
import { isMembershipAccessBlocked } from './utils/membershipUi.js';

const MEMBERSHIP_BLOCKED_MSG = 'Tu membresía venció — habla con tu entrenador.';

const route = useRoute();
const router = useRouter();

const loading = shallowRef(true);
const loadError = shallowRef('');
const membershipBlocked = shallowRef(false);
const dayLocked = shallowRef(false);
const dayLockLabel = shallowRef('');
const alreadyCompleted = shallowRef(false);
const saveError = shallowRef('');
const saving = shallowRef(false);
const saved = shallowRef(false);
/** True when session is queued locally pending network (Feature 086). */
const savedOffline = shallowRef(false);
const formError = shallowRef('');
const sessionRoutineName = shallowRef('');
/** Routine payload kept until the user taps "Comenzar entrenamiento" (audio unlock). */
const pendingRoutine = shallowRef(null);
const newPrs = shallowRef([]);
const showPrCelebration = shallowRef(false);
const streakMessage = shallowRef('');
const showNextTechSheet = shallowRef(false);
const cancelDialogOpen = shallowRef(false);
const discardingDraft = shallowRef(false);
const snackbar = reactive({
  show: false,
  text: '',
  color: 'surface',
});

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
  canPostpone,
  start,
  restore,
  configurePersistence,
  clearPersistedDraft,
  completeSet,
  skipRest,
  adjustRest,
  postponeExercise,
  reset,
  unlockAudio,
} = useWorkoutSession();

useWakeLock(phase);
useOfflineWorkoutSync();

const {
  draft: recoveryDraft,
  dialogOpen: recoveryDialogOpen,
  refresh: refreshRecoveryDraft,
  discard: discardRecoveryDraft,
  resume: resumeRecoveryDraft,
} = useActiveWorkoutRecovery({ checkOnMount: false, autoOpen: false });

const sessionUser = shallowRef(null);

const showCancelAction = computed(() => (
  phase.value === 'working' || phase.value === 'resting'
));

function wirePersistence(routineId, routineName) {
  const user = sessionUser.value || getSessionUser();
  if (!user?.id) return;
  configurePersistence({
    clientId: user.id,
    routineId: Number(routineId),
    routineName: routineName || '',
  });
}

function notify(text, color = 'surface') {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}

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
    savedOffline.value = false;
    const payload = {
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
    };

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      await enqueueWorkoutSession(payload);
      await clearPersistedDraft();
      saved.value = true;
      savedOffline.value = true;
      saveError.value = '';
      return;
    }

    const response = await createMyWorkoutSession(payload);
    const data = response.data?.data ?? {};
    const prs = Array.isArray(data.new_prs) ? data.new_prs : [];
    newPrs.value = prs;
    if (prs.length > 0) {
      showPrCelebration.value = true;
    }
    const streak = Number(data.consistency?.current_streak) || 0;
    if (streak > 0 && prs.length === 0) {
      streakMessage.value = `Racha: ${streak} día${streak === 1 ? '' : 's'} consecutivos`;
    }
    await clearPersistedDraft();
    saved.value = true;
    savedOffline.value = false;
  } catch (error) {
    console.error('Error guardando sesión de entrenamiento:', error);
    if (isMembershipBlockedError(error)) {
      membershipBlocked.value = true;
      saveError.value = MEMBERSHIP_BLOCKED_MSG;
      return;
    }
    if (isNetworkError(error)) {
      try {
        await enqueueWorkoutSession({
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
        await clearPersistedDraft();
        saved.value = true;
        savedOffline.value = true;
        saveError.value = '';
        return;
      } catch (queueError) {
        console.error('Error encolando sesión offline:', queueError);
      }
    }
    saveError.value = getApiErrorMessage(error, 'No se pudo guardar el entrenamiento');
  } finally {
    saving.value = false;
  }
}

/**
 * Apply IndexedDB draft if it matches this route (or ?resume=1).
 * @param {number} routineId
 * @returns {Promise<boolean>} true if restored
 */
async function tryRestoreDraft(routineId) {
  const draft = await refreshRecoveryDraft();
  if (!draft) return false;

  const wantResume = String(route.query.resume || '') === '1';
  const sameRoutine = Number(draft.routineId) === Number(routineId);

  if (sameRoutine || wantResume) {
    if (!sameRoutine && wantResume) {
      // resume=1 for another routine: navigate there instead
      resumeRecoveryDraft(router);
      return true;
    }
    try {
      unlockAudio();
      restore(draft);
      sessionRoutineName.value = draft.routineName || sessionRoutineName.value;
      pendingRoutine.value = null;
      if (route.query.resume) {
        router.replace({
          name: 'WorkoutPlayer',
          params: { routineId: draft.routineId },
          query: {},
        });
      }
      return true;
    } catch (error) {
      console.warn('[workoutRecovery] restore failed:', error);
      return false;
    }
  }

  // Draft belongs to another routine — prompt before starting a new one.
  recoveryDialogOpen.value = true;
  return false;
}

async function loadRoutine() {
  try {
    loading.value = true;
    loadError.value = '';
    membershipBlocked.value = false;
    dayLocked.value = false;
    dayLockLabel.value = '';
    alreadyCompleted.value = false;
    pendingRoutine.value = null;
    const routineId = Number(route.params.routineId);

    const [routinesRes, membershipRes, sessionsRes] = await Promise.all([
      getMyRoutines(),
      getMyMembership().catch((error) => {
        console.warn('No se pudo cargar membresía en player:', error);
        return null;
      }),
      getMyWorkoutSessions().catch((error) => {
        console.warn('No se pudo cargar sesiones en player:', error);
        return null;
      }),
    ]);

    if (membershipRes) {
      const mem = normalizeMembershipPeriod(membershipRes.data?.data ?? null);
      membershipBlocked.value = isMembershipAccessBlocked(mem);
    }

    const list = routinesRes.data.data ?? [];
    const routine = list.find((item) => Number(item.id) === routineId);
    if (!routine) {
      loadError.value = 'No encontramos esa rutina en tu plan.';
      return;
    }
    sessionRoutineName.value = routine.nombre_rutina || '';
    wirePersistence(routineId, sessionRoutineName.value);

    const localDate = todayLocalDate();
    const sessions = sessionsRes?.data?.data ?? [];
    const doneToday = sessions.some((session) => {
      if (session.status !== 'completed') return false;
      if (Number(session.routine_id) !== Number(routineId)) return false;
      const raw = session.finished_at || session.created_at || session.started_at;
      if (!raw) return false;
      try {
        return formatLocalDate(raw) === localDate;
      } catch {
        return false;
      }
    });
    if (doneToday) {
      alreadyCompleted.value = true;
      const user = sessionUser.value || getSessionUser();
      if (user?.id) {
        const draft = await getActiveWorkoutDraft(user.id);
        if (draft && Number(draft.routineId) === Number(routineId)) {
          await clearActiveWorkoutDraft(user.id);
        }
      }
      return;
    }

    if (!isRoutineScheduledForDate(routine)) {
      dayLocked.value = true;
      dayLockLabel.value = routine.dia_semana || '';
      return;
    }

    if (membershipBlocked.value) {
      return;
    }

    const restored = await tryRestoreDraft(routineId);
    if (restored) return;

    pendingRoutine.value = routine;
  } catch (error) {
    console.error('Error cargando rutina para el player:', error);
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

function goToPreview() {
  const id = Number(route.params.routineId);
  if (Number.isInteger(id) && id > 0) {
    router.push({ name: 'ClientRoutinePreview', params: { routineId: id } });
    return;
  }
  goBack();
}

/**
 * First user gesture: unlock HTMLAudioElement (autoplay policy) then start session.
 */
function onBeginWorkout() {
  if (!pendingRoutine.value) return;
  unlockAudio();
  wirePersistence(route.params.routineId, sessionRoutineName.value);
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

/** Feature 087: requeue because equipment is busy (not a casual skip). */
function onPostponeExercise() {
  formError.value = '';
  const result = postponeExercise(currentExercise.value?.id ?? null);
  if (!result.ok) {
    if (result.reason === 'last') {
      notify('Ya es el último ejercicio de la cola', 'warning');
    }
    return;
  }
  const next = result.nextName
    ? ` Vuelve después de ${result.nextName}.`
    : '';
  notify(`Máquina ocupada: ${result.postponedName}.${next}`);
}

function openNextTechSheet() {
  if (!nextExercisePreview.value) return;
  showNextTechSheet.value = true;
}

function goBack() {
  router.push('/dashboard');
}

function openCancelDialog() {
  cancelDialogOpen.value = true;
}

async function onConfirmCancelWorkout() {
  cancelDialogOpen.value = false;
  reset();
  await clearPersistedDraft();
  goBack();
}

function onResumeOtherDraft() {
  resumeRecoveryDraft(router);
}

async function onDiscardOtherDraft() {
  discardingDraft.value = true;
  try {
    await discardRecoveryDraft();
  } finally {
    discardingDraft.value = false;
  }
}

watch(phase, async (next) => {
  if (next === 'finished') {
    await persistSession();
  }
  if (next !== 'resting') {
    showNextTechSheet.value = false;
  }
});

watch(currentExercise, () => {
  formError.value = '';
});

watch(nextExercisePreview, (preview) => {
  if (!preview) showNextTechSheet.value = false;
});

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'client') {
    router.push('/');
    return;
  }
  sessionUser.value = user;
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
      <button
        v-if="showCancelAction"
        type="button"
        class="player-cancel"
        aria-label="Cancelar entrenamiento"
        @click="openCancelDialog"
      >
        Cancelar
      </button>
      <div
        v-if="showSessionClock"
        class="player-elapsed"
        aria-label="Duración de la sesión"
      >
        {{ sessionElapsedFormatted }}
      </div>
    </header>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mx-4" />

    <MembershipLockedState
      v-else-if="membershipBlocked && !pendingRoutine && phase === 'idle'"
      title="Entrenamiento pausado"
      message="Tu membresía venció. Renueva con tu entrenador para volver a entrenar."
      @back="goBack"
    />

    <main
      v-else-if="alreadyCompleted && phase === 'idle'"
      class="player-main player-main--ready"
      role="status"
    >
      <p class="player-step">Completado</p>
      <h1 class="player-title">{{ sessionRoutineName || 'Tu rutina' }}</h1>
      <p class="player-day-lock">
        Ya terminaste esta rutina hoy. Puedes revisarla, pero no se vuelve a empezar el mismo día.
      </p>
      <button type="button" class="player-cta player-cta--ready" @click="goToPreview">
        Ver rutina
      </button>
      <button type="button" class="player-cta-secondary" @click="goBack">
        Volver al inicio
      </button>
    </main>

    <main
      v-else-if="dayLocked && phase === 'idle'"
      class="player-main player-main--ready"
      role="status"
    >
      <p class="player-step">Aún no es el día</p>
      <h1 class="player-title">{{ sessionRoutineName || 'Tu rutina' }}</h1>
      <p class="player-day-lock">
        Programada para {{ dayLockLabel || 'otro día' }}.
        Hoy solo puedes verla; podrás empezar ese día.
      </p>
      <button type="button" class="player-cta player-cta--ready" @click="goToPreview">
        Ver rutina
      </button>
      <button type="button" class="player-cta-secondary" @click="goBack">
        Volver al inicio
      </button>
    </main>

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
        <div class="player-step-row">
          <p class="player-step">{{ exerciseCounter }}</p>
          <button
            v-if="canPostpone"
            type="button"
            class="player-busy-equip"
            aria-label="Máquina ocupada: hacer este ejercicio después del siguiente"
            @click="onPostponeExercise"
          >
            <v-icon icon="mdi-account-clock-outline" size="18" aria-hidden="true" />
            Máquina ocupada
          </button>
        </div>
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
        @preview="openNextTechSheet"
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
        :saved-offline="savedOffline"
        :save-error="saveError"
        :streak-message="streakMessage"
        @retry="persistSession"
        @done="goBack"
      />
    </main>

    <PrCelebrationOverlay v-model="showPrCelebration" :prs="newPrs" />

    <NextExerciseTechSheetDialog
      v-model="showNextTechSheet"
      :preview="nextExercisePreview"
    />

    <WorkoutRecoveryDialog
      v-model="recoveryDialogOpen"
      :routine-name="recoveryDraft?.routineName || ''"
      :started-at="recoveryDraft?.startedAt || ''"
      :discarding="discardingDraft"
      @resume="onResumeOtherDraft"
      @discard="onDiscardOtherDraft"
    />

    <ConfirmActionDialog
      v-model="cancelDialogOpen"
      title="¿Cancelar entrenamiento?"
      description="Se perderá el progreso de esta sesión y no se guardará."
      confirm-label="Cancelar entrenamiento"
      cancel-label="Seguir entrenando"
      confirm-color="error"
      @confirm="onConfirmCancelWorkout"
    />

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="2800"
      location="top"
      multi-line
    >
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.player-bg {
  box-sizing: border-box;
  height: 100%;
  height: 100dvh;
  max-height: 100dvh;
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
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

.player-cancel {
  flex-shrink: 0;
  min-height: 44px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.player-cancel:focus-visible {
  outline: 2px solid #00E5FF;
  outline-offset: 2px;
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
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 4px 16px 12px;
  touch-action: pan-y;
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
  justify-content: flex-start;
  padding-top: 1.25rem;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
}

.player-cta--ready {
  margin-top: 28px;
}

.player-day-lock {
  margin: 0.75rem 0 0;
  max-width: 22rem;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.player-cta-secondary {
  margin-top: 0.75rem;
  border: 0;
  background: transparent;
  color: var(--tf-on-surface-muted, #a8b0bc);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.player-cta-secondary:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 3px;
  border-radius: 4px;
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

.player-step-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 4px;
}

.player-step-row .player-step {
  margin: 0;
  min-width: 0;
}

.player-busy-equip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  flex-shrink: 0;
  min-height: 44px;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 193, 7, 0.45);
  background: rgba(255, 193, 7, 0.08);
  color: #ffc107;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
}

.player-busy-equip:active {
  transform: scale(0.97);
  background: rgba(255, 193, 7, 0.14);
}

.player-busy-equip:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
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
