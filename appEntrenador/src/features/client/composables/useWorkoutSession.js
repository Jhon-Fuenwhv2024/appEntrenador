import { computed, onUnmounted, ref, shallowRef } from 'vue';
import {
  parseSetPrescription,
  resolveSetPrefill,
} from '../../../shared/routines/setPrescription.js';
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
 * Rest also runs after the last set of an exercise / group before the next exercise
 * (unless rest_time_seconds is 0).
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
  /**
   * Explicit destination after rest ends.
   * @type {import('vue').ShallowRef<{ exerciseIndex: number, setIndex: number }|null>}
   */
  const restTarget = shallowRef(null);
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

      const target = resolveSetPrefill(ex, i);

      rows.push({
        setNumber: i,
        status,
        weight: log ? log.weight : null,
        reps: log ? log.reps : null,
        targetWeight: target.weight,
        targetReps: target.reps,
        previousLabel,
      });
    }
    return rows;
  });

  /** Up-next preview while resting (Feature 059). */
  const nextExercisePreview = computed(() => {
    if (phase.value !== 'resting') return null;

    const target = restTarget.value;
    if (!target) return null;

    const list = exercises.value;
    const ex = list[target.exerciseIndex];
    if (!ex) return null;

    const nextSetNumber = target.setIndex + 1;
    const total = Number(ex.series) || 0;
    const metrics = resolvePrefillMetrics(ex, nextSetNumber);
    const metricsParts = [];
    if (metrics.weight > 0) metricsParts.push(`${metrics.weight} kg`);
    if (metrics.reps > 0) metricsParts.push(`${metrics.reps} reps`);

    return {
      nombre: ex.nombre || 'Siguiente',
      setNumber: nextSetNumber,
      totalSets: total,
      label: total > 0
        ? `Serie ${nextSetNumber} de ${total}`
        : `Serie ${nextSetNumber}`,
      weight: metrics.weight,
      reps: metrics.reps,
      metricsLabel: metricsParts.join(' × ') || '',
      media_type: ex.media_type ?? null,
      media_url: ex.media_url ?? null,
      local_media_path: ex.local_media_path ?? null,
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

  /**
   * Last set logged this session for the given exercise (weight/reps carry-forward).
   * @param {{ id?: number|null, nombre?: string }} ex
   */
  function findLastSessionLog(ex) {
    if (!ex) return null;
    const exerciseId = ex.id ?? null;
    const exerciseName = ex.nombre;
    for (let i = logs.value.length - 1; i >= 0; i -= 1) {
      const entry = logs.value[i];
      if (exerciseId != null && entry.exerciseId != null) {
        if (Number(entry.exerciseId) === Number(exerciseId)) return entry;
      } else if (entry.exerciseName === exerciseName) {
        return entry;
      }
    }
    return null;
  }

  /**
   * Weight/reps prefill for a set: logged set → per-set prescription → last session log → uniform.
   * @param {{ id?: number|null, nombre?: string, peso?: number, repeticiones?: number, set_prescription?: unknown }} ex
   * @param {number} [setNumber] 1-based
   * @returns {{ weight: number, reps: number }}
   */
  function resolvePrefillMetrics(ex, setNumber = currentSetNumber.value) {
    if (!ex) return { weight: 0, reps: 0 };

    const setLog = logs.value.find((entry) => {
      if (entry.setNumber !== setNumber) return false;
      if (ex.id != null && entry.exerciseId != null) {
        return Number(entry.exerciseId) === Number(ex.id);
      }
      return entry.exerciseName === ex.nombre;
    });
    if (setLog) {
      return {
        weight: Number(setLog.weight) || 0,
        reps: Number(setLog.reps) || 0,
      };
    }

    if (parseSetPrescription(ex.set_prescription)) {
      return resolveSetPrefill(ex, setNumber);
    }

    const lastLog = findLastSessionLog(ex);
    if (lastLog) {
      return {
        weight: Number(lastLog.weight) || 0,
        reps: Number(lastLog.reps) || 0,
      };
    }

    return resolveSetPrefill(ex, setNumber);
  }

  /**
   * Prefill weight/reps: last set of this exercise in the session, else prescribed.
   */
  function syncInputDefaults() {
    const ex = currentExercise.value;
    if (!ex) {
      actualWeight.value = 0;
      actualReps.value = 0;
      return;
    }

    const metrics = resolvePrefillMetrics(ex);
    actualWeight.value = metrics.weight;
    actualReps.value = metrics.reps;
  }

  function goToExercise(nextIndex, nextSetIndex = 0) {
    exerciseIndex.value = nextIndex;
    setIndex.value = nextSetIndex;
    phase.value = 'working';
    syncInputDefaults();
  }

  function advanceAfterRest() {
    const target = restTarget.value;
    restTarget.value = null;

    if (target
      && target.exerciseIndex >= 0
      && target.exerciseIndex < exercises.value.length) {
      goToExercise(target.exerciseIndex, Math.max(0, Number(target.setIndex) || 0));
      return;
    }

    // Fallback: next set on current exercise.
    setIndex.value += 1;
    phase.value = 'working';
    syncInputDefaults();
  }

  function finishRest() {
    cancelTimer();
    if (phase.value !== 'resting') return;
    advanceAfterRest();
  }

  /**
   * @param {{ nextExerciseIndex: number, nextSetIndex: number }} target
   */
  function startRest({ nextExerciseIndex, nextSetIndex }) {
    restTarget.value = {
      exerciseIndex: nextExerciseIndex,
      setIndex: nextSetIndex,
    };
    const seconds = resolveRestSeconds();
    restDuration.value = seconds;
    if (seconds <= 0) {
      advanceAfterRest();
      return;
    }
    phase.value = 'resting';
    startTimer(seconds, {
      onComplete: () => {
        if (phase.value !== 'resting') return;
        advanceAfterRest();
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
    restTarget.value = null;
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
        startRest({
          nextExerciseIndex: group.start,
          nextSetIndex: setIndex.value + 1,
        });
        return;
      }

      const nextIndex = group.end + 1;
      if (nextIndex < exercises.value.length) {
        startRest({
          nextExerciseIndex: nextIndex,
          nextSetIndex: 0,
        });
        return;
      }

      cancelTimer();
      phase.value = 'finished';
      return;
    }

    // Ungrouped / singleton: Feature 028 linear behavior + inter-exercise rest.
    if (!isLastSetOfExercise.value) {
      startRest({
        nextExerciseIndex: exerciseIndex.value,
        nextSetIndex: setIndex.value + 1,
      });
      return;
    }

    if (!isLastExercise.value) {
      startRest({
        nextExerciseIndex: exerciseIndex.value + 1,
        nextSetIndex: 0,
      });
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
    restTarget.value = null;
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
