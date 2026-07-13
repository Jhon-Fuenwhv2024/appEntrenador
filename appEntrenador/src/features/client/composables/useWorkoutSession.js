import { computed, onUnmounted, ref, shallowRef } from 'vue';

export const DEFAULT_REST_SECONDS = 90;

/**
 * Orchestrates an active workout: current exercise/set, rest timer, local set logs.
 * @param {{ restSeconds?: number }} [options]
 */
export function useWorkoutSession(options = {}) {
  const restDuration = options.restSeconds ?? DEFAULT_REST_SECONDS;

  const routine = shallowRef(null);
  const exerciseIndex = ref(0);
  const setIndex = ref(0);
  const phase = ref('idle'); // idle | working | resting | finished
  const restSecondsLeft = ref(0);
  const actualWeight = ref(0);
  const actualReps = ref(0);
  const logs = ref([]);
  const startedAt = shallowRef(null);

  let restTimerId = null;

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

  function clearRestTimer() {
    if (restTimerId != null) {
      clearInterval(restTimerId);
      restTimerId = null;
    }
  }

  function syncInputDefaults() {
    const ex = currentExercise.value;
    actualWeight.value = ex ? Number(ex.peso) || 0 : 0;
    actualReps.value = ex ? Number(ex.repeticiones) || 0 : 0;
  }

  function start(nextRoutine) {
    clearRestTimer();
    if (!nextRoutine?.ejercicios?.length) {
      throw new Error('La rutina no tiene ejercicios.');
    }
    routine.value = nextRoutine;
    exerciseIndex.value = 0;
    setIndex.value = 0;
    phase.value = 'working';
    restSecondsLeft.value = 0;
    logs.value = [];
    startedAt.value = new Date().toISOString();
    syncInputDefaults();
  }

  function finishRest() {
    clearRestTimer();
    restSecondsLeft.value = 0;
    if (phase.value !== 'resting') return;
    setIndex.value += 1;
    phase.value = 'working';
    syncInputDefaults();
  }

  function startRest() {
    clearRestTimer();
    phase.value = 'resting';
    restSecondsLeft.value = restDuration;
    restTimerId = setInterval(() => {
      if (restSecondsLeft.value <= 1) {
        finishRest();
        return;
      }
      restSecondsLeft.value -= 1;
    }, 1000);
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

    clearRestTimer();
    phase.value = 'finished';
  }

  function reset() {
    clearRestTimer();
    routine.value = null;
    exerciseIndex.value = 0;
    setIndex.value = 0;
    phase.value = 'idle';
    restSecondsLeft.value = 0;
    actualWeight.value = 0;
    actualReps.value = 0;
    logs.value = [];
    startedAt.value = null;
  }

  onUnmounted(() => {
    clearRestTimer();
  });

  return {
    routine,
    exerciseIndex,
    setIndex,
    phase,
    restSecondsLeft,
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
  };
}
