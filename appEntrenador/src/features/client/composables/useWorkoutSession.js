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

function formatElapsed(totalSeconds) {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const rem = secs % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

/**
 * Orchestrates an active workout: current exercise/set, rest timer, local set logs.
 * Rest countdown uses wall-clock timestamps (background-throttling resilient).
 * Feature 029: within a contiguous superset letter, rest starts only after the
 * last exercise in the group completes the current set round.
 * Feature 059: sets checklist, rest ±15, session elapsed, Up next preview.
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
  /** Duration used for the active / last rest (for UI ring + copy). */
  const restDuration = shallowRef(defaultRestSeconds);
  /** After rest in a multi-exercise group, jump back to this index. */
  const restReturnExerciseIndex = shallowRef(null);
  /** Wall-clock tick for session elapsed display (Feature 059). */
  const nowMs = shallowRef(Date.now());
  let elapsedTickId = null;

  const {
    secondsLeft: restSecondsLeft,
    formattedTime: restFormattedTime,
    start: startTimer,
    cancel: cancelTimer,
    adjust: adjustTimer,
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

  /** 0–1 remaining fraction for rest ring (Feature 059). */
  const restProgress = computed(() => {
    const total = Number(restDuration.value) || 0;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, restSecondsLeft.value / total));
  });

  const sessionElapsedFormatted = computed(() => {
    if (!startedAt.value) return '00:00';
    const startMs = new Date(startedAt.value).getTime();
    if (!Number.isFinite(startMs)) return '00:00';
    return formatElapsed((nowMs.value - startMs) / 1000);
  });

  /**
   * Checklist rows for the current exercise (Feature 059).
   * @returns {Array<{ setNumber: number, status: 'done'|'current'|'pending', weight: number|null, reps: number|null, previousLabel: string }>}
   */
  const setsChecklist = computed(() => {
    const ex = currentExercise.value;
    if (!ex) return [];

    const total = Number(ex.series) || 0;
    const exerciseId = ex.id ?? null;
    const exerciseName = ex.nombre;
    const prev = ex.last_log;
    const previousLabel = prev && prev.weight != null && prev.reps != null
      ? `${prev.weight}kg × ${prev.reps}`
      : '—';

    const rows = [];
    for (let i = 1; i <= total; i += 1) {
      const log = logs.value.find((entry) => {
        if (entry.setNumber !== i) return false;
        if (exerciseId != null && entry.exerciseId != null) {
          return Number(entry.exerciseId) === Number(exerciseId);
        }
        return entry.exerciseName === exerciseName;
      });

      let status = 'pending';
      if (log) {
        status = 'done';
      } else if (phase.value === 'working' && i === currentSetNumber.value) {
        status = 'current';
      }

      rows.push({
        setNumber: i,
        status,
        weight: log ? log.weight : null,
        reps: log ? log.reps : null,
        previousLabel,
      });
    }
    return rows;
  });

  /** Up-next preview while resting (Feature 059). */
  const nextExercisePreview = computed(() => {
    if (phase.value !== 'resting') return null;

    const list = exercises.value;
    const returnIndex = restReturnExerciseIndex.value;
    const nextSetNumber = setIndex.value + 2;

    if (returnIndex != null && returnIndex >= 0 && returnIndex < list.length) {
      const ex = list[returnIndex];
      return {
        nombre: ex?.nombre || 'Siguiente',
        setNumber: nextSetNumber,
        label: `Serie ${nextSetNumber}`,
      };
    }

    const ex = currentExercise.value;
    if (!ex) return null;
    return {
      nombre: ex.nombre,
      setNumber: nextSetNumber,
      label: `Serie ${nextSetNumber}`,
    };
  });

  function stopElapsedTick() {
    if (elapsedTickId != null) {
      clearInterval(elapsedTickId);
      elapsedTickId = null;
    }
  }

  function startElapsedTick() {
    stopElapsedTick();
    nowMs.value = Date.now();
    elapsedTickId = setInterval(() => {
      nowMs.value = Date.now();
    }, 1000);
  }

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
    startElapsedTick();
  }

  function skipRest() {
    if (phase.value !== 'resting') return;
    finishRest();
  }

  /**
   * Adjust active rest by ±seconds (Feature 059). Updates ring total duration.
   * @param {number} deltaSeconds
   */
  function adjustRest(deltaSeconds) {
    if (phase.value !== 'resting') return;
    const delta = Math.round(Number(deltaSeconds) || 0);
    if (!delta) return;

    const nextDuration = Math.max(0, Number(restDuration.value) + delta);
    restDuration.value = nextDuration;
    adjustTimer(delta);
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
    stopElapsedTick();
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
    stopElapsedTick();
  });

  return {
    routine,
    exerciseIndex,
    setIndex,
    phase,
    restSecondsLeft,
    restFormattedTime,
    restProgress,
    actualWeight,
    actualReps,
    logs,
    startedAt,
    sessionElapsedFormatted,
    currentExercise,
    totalExercises,
    currentSetNumber,
    totalSets,
    progressLabel,
    restDuration,
    currentSupersetGroup,
    exercises,
    setsChecklist,
    nextExercisePreview,
    start,
    completeSet,
    skipRest,
    adjustRest,
    reset,
    unlockAudio,
  };
}
