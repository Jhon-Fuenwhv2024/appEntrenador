import { computed, onUnmounted, ref, shallowRef } from 'vue';
import { useTimer } from './useTimer.js';

export const DEFAULT_REST_SECONDS = 90;

/**
 * Contiguous range of exercises sharing the same non-empty superset_letter.
 * Empty / null letter → singleton group [index, index].
 * @param {Array<{ superset_letter?: string|null }>} exercises
 * @param {number} index
 * @returns {{ start: number, end: number, letter: string|null }}
 */
export function resolveAdjacentSupersetGroup(exercises, index) {
  const list = Array.isArray(exercises) ? exercises : [];
  if (index < 0 || index >= list.length) {
    return { start: index, end: index, letter: null };
  }

  const raw = list[index]?.superset_letter;
  const letter = typeof raw === 'string' && raw.trim()
    ? raw.trim().toUpperCase()
    : null;

  if (!letter) {
    return { start: index, end: index, letter: null };
  }

  let start = index;
  while (start > 0) {
    const prev = list[start - 1]?.superset_letter;
    const prevLetter = typeof prev === 'string' && prev.trim()
      ? prev.trim().toUpperCase()
      : null;
    if (prevLetter !== letter) break;
    start -= 1;
  }

  let end = index;
  while (end < list.length - 1) {
    const next = list[end + 1]?.superset_letter;
    const nextLetter = typeof next === 'string' && next.trim()
      ? next.trim().toUpperCase()
      : null;
    if (nextLetter !== letter) break;
    end += 1;
  }

  return { start, end, letter };
}

/**
 * Orchestrates an active workout: current exercise/set, rest timer, local set logs.
 * Rest countdown uses wall-clock timestamps (background-throttling resilient).
 * Feature 029: within a contiguous superset letter, rest starts only after the
 * last exercise in the group completes the current set round.
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
  /** After rest in a multi-exercise group, jump back to this index. */
  const restReturnExerciseIndex = shallowRef(null);

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

  const currentSupersetGroup = computed(() => (
    resolveAdjacentSupersetGroup(exercises.value, exerciseIndex.value)
  ));

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
    const returnIndex = restReturnExerciseIndex.value;
    restReturnExerciseIndex.value = null;

    if (returnIndex != null && returnIndex >= 0 && returnIndex < exercises.value.length) {
      exerciseIndex.value = returnIndex;
    }

    setIndex.value += 1;
    phase.value = 'working';
    syncInputDefaults();
  }

  function finishRest() {
    cancelTimer();
    if (phase.value !== 'resting') return;
    advanceToNextSet();
  }

  function startRest({ returnToExerciseIndex = null } = {}) {
    restReturnExerciseIndex.value = returnToExerciseIndex;
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
    restReturnExerciseIndex.value = null;
    syncInputDefaults();
  }

  function skipRest() {
    if (phase.value !== 'resting') return;
    finishRest();
  }

  function goToExercise(nextIndex, nextSetIndex = 0) {
    exerciseIndex.value = nextIndex;
    setIndex.value = nextSetIndex;
    phase.value = 'working';
    syncInputDefaults();
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

    const group = resolveAdjacentSupersetGroup(exercises.value, exerciseIndex.value);
    const inMultiGroup = group.letter != null && group.end > group.start;

    if (inMultiGroup) {
      // Still more exercises in this group for the same set round → no rest.
      if (exerciseIndex.value < group.end) {
        goToExercise(exerciseIndex.value + 1, setIndex.value);
        return;
      }

      // Last exercise of the group for this round.
      const groupHasMoreSets = exercises.value
        .slice(group.start, group.end + 1)
        .some((member) => setIndex.value + 1 < (Number(member.series) || 0));

      if (groupHasMoreSets) {
        startRest({ returnToExerciseIndex: group.start });
        return;
      }

      const nextIndex = group.end + 1;
      if (nextIndex < exercises.value.length) {
        goToExercise(nextIndex, 0);
        return;
      }

      cancelTimer();
      phase.value = 'finished';
      return;
    }

    // Ungrouped / singleton: Feature 028 linear behavior.
    if (!isLastSetOfExercise.value) {
      startRest();
      return;
    }

    if (!isLastExercise.value) {
      goToExercise(exerciseIndex.value + 1, 0);
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
    restReturnExerciseIndex.value = null;
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
    currentSupersetGroup,
    exercises,
    start,
    completeSet,
    skipRest,
    reset,
    unlockAudio,
  };
}
