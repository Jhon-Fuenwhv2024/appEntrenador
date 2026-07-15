import { computed, onUnmounted, ref, shallowRef } from 'vue';
import { useTimer } from './useTimer.js';

export const DEFAULT_REST_SECONDS = 90;

/**
 * Orchestrates an active workout: current exercise/set, rest timer, local set logs.
 * Rest countdown uses wall-clock timestamps (background-throttling resilient).
 * @param {{ restSeconds?: number }} [options]
 */
export function useWorkoutSession(options = {}) {
  const defaultRestSeconds = options.restSeconds ?? DEFAULT_REST_SECONDS;

  const routine = shallowRef(null);
  const exerciseIndex = ref(0);
  const setIndex = ref(0);
  const phase = ref('idle'); // idle | working | resting | finished
  const actualWeight = ref(0);
  const actualReps = ref(0);
  const logs = ref([]);
  const startedAt = shallowRef(null);
  /** Duration used for the active / last rest (for UI copy). */
  const restDuration = shallowRef(defaultRestSeconds);

  const {
    secondsLeft: restSecondsLeft,
    formattedTime: restFormattedTime,
    start: startTimer,
    cancel: cancelTimer,
    unlockAudio,
  } = useTimer();

  const exercises = computed(() => routine.value?.ejercicios ?? []);

  const currentExercise = computed(() => exercises.value[exerciseIndex.value] ?? null);

  const totalExercises = computed(() => exercises.value.length);

  const currentSetNumber = computed(() => setIndex.value + 1);

  const totalSets = computed(() => Number(currentExercise.value?.series) || 0);

  const isLastSetOfExercise = computed(
    () => currentSetNumber.value >= totalSets.value,
  );

  const isLastExercise = computed(
    () => exerciseIndex.value >= totalExercises.value - 1,
  );

  const progressLabel = computed(() => {
    const ex = currentExercise.value;
    if (!ex) return '';
    return `Serie ${currentSetNumber.value} de ${totalSets.value}`;
  });

  function resolveRestSeconds() {
    const fromExercise = Number(currentExercise.value?.rest_time_seconds);
    if (Number.isFinite(fromExercise) && fromExercise >= 0) {
      return Math.round(fromExercise);
    }
    return defaultRestSeconds;
  }

  function syncInputDefaults() {
    const ex = currentExercise.value;
    actualWeight.value = ex ? Number(ex.peso) || 0 : 0;
    actualReps.value = ex ? Number(ex.repeticiones) || 0 : 0;
  }

  function advanceToNextSet() {
    setIndex.value += 1;
    phase.value = 'working';
    syncInputDefaults();
  }

  function finishRest() {
    cancelTimer();
    if (phase.value !== 'resting') return;
    advanceToNextSet();
  }

  function startRest() {
    const seconds = resolveRestSeconds();
    restDuration.value = seconds;
    if (seconds <= 0) {
      advanceToNextSet();
      return;
    }
    phase.value = 'resting';
    startTimer(seconds, {
      onComplete: () => {
        if (phase.value !== 'resting') return;
        advanceToNextSet();
      },
    });
  }

  function start(nextRoutine) {
    cancelTimer();
    if (!nextRoutine?.ejercicios?.length) {
      throw new Error('La rutina no tiene ejercicios.');
    }
    routine.value = nextRoutine;
    exerciseIndex.value = 0;
    setIndex.value = 0;
    phase.value = 'working';
    logs.value = [];
    startedAt.value = new Date().toISOString();
    restDuration.value = defaultRestSeconds;
    syncInputDefaults();
  }

  function skipRest() {
    if (phase.value !== 'resting') return;
    finishRest();
  }

  function completeSet({ weight, reps } = {}) {
    if (phase.value !== 'working') return;
    const ex = currentExercise.value;
    if (!ex) return;

    const w = weight != null ? Number(weight) : Number(actualWeight.value);
    const r = Math.round(reps != null ? Number(reps) : Number(actualReps.value));

    if (Number.isNaN(w) || w < 0 || Number.isNaN(r) || r < 1) {
      throw new Error('Peso o repeticiones inválidos.');
    }

    logs.value.push({
      exerciseId: ex.id ?? null,
      exerciseName: ex.nombre,
      setNumber: currentSetNumber.value,
      weight: w,
      reps: r,
    });

    if (!isLastSetOfExercise.value) {
      startRest();
      return;
    }

    if (!isLastExercise.value) {
      exerciseIndex.value += 1;
      setIndex.value = 0;
      phase.value = 'working';
      syncInputDefaults();
      return;
    }

    cancelTimer();
    phase.value = 'finished';
  }

  function reset() {
    cancelTimer();
    routine.value = null;
    exerciseIndex.value = 0;
    setIndex.value = 0;
    phase.value = 'idle';
    actualWeight.value = 0;
    actualReps.value = 0;
    logs.value = [];
    startedAt.value = null;
    restDuration.value = defaultRestSeconds;
  }

  onUnmounted(() => {
    cancelTimer();
  });

  return {
    routine,
    exerciseIndex,
    setIndex,
    phase,
    restSecondsLeft,
    restFormattedTime,
    actualWeight,
    actualReps,
    logs,
    startedAt,
    currentExercise,
    totalExercises,
    currentSetNumber,
    totalSets,
    progressLabel,
    restDuration,
    start,
    completeSet,
    skipRest,
    reset,
    unlockAudio,
  };
}
