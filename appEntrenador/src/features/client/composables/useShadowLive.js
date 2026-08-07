import { onUnmounted, shallowRef, watch } from 'vue';
import {
  clearWorkoutLive,
  getShadowModeSettings,
  patchWorkoutLive,
} from '../api/shadowModeApi.js';

const SNAPSHOT_MIN_MS = 5000;

/**
 * Publishes workout live snapshots (throttled) and surfaces trainer cues
 * returned in the PATCH response (Feature 076 — no extra cue poll).
 *
 * @param {{
 *   phase: import('vue').Ref<string>,
 *   exerciseIndex: import('vue').Ref<number>,
 *   setIndex: import('vue').Ref<number>,
 *   currentExercise: import('vue').ComputedRef<object|null>,
 *   restEndsAt: import('vue').Ref<number|null>|import('vue').ComputedRef<number|null>|import('vue').ShallowRef<number|null>,
 *   routineName: import('vue').Ref<string>|import('vue').ComputedRef<string>|import('vue').ShallowRef<string>,
 * }} sources
 */
export function useShadowLive(sources) {
  const shadowEnabled = shallowRef(true);
  const shadowAvailable = shallowRef(true);
  const activeCue = shallowRef(null);
  const publishing = shallowRef(false);

  let lastSentAt = 0;
  let lastFingerprint = '';
  let disposed = false;
  let cueClearTimer = null;
  let heartbeatId = null;
  let wasLive = false;

  async function loadPreference() {
    try {
      const response = await getShadowModeSettings();
      shadowEnabled.value = response.data?.data?.shadow_mode_enabled !== false;
    } catch (error) {
      console.warn('[shadow] no se pudo cargar preferencia:', error);
      shadowEnabled.value = true;
    }
  }

  function buildFingerprint() {
    return [
      sources.phase.value,
      sources.exerciseIndex.value,
      sources.setIndex.value,
      sources.currentExercise.value?.nombre || '',
    ].join('|');
  }

  function buildPayload() {
    const exercise = sources.currentExercise.value;
    const restMs = typeof sources.restEndsAt?.value === 'number'
      ? sources.restEndsAt.value
      : null;

    return {
      phase: sources.phase.value,
      exerciseName: exercise?.nombre || exercise?.name || 'Ejercicio',
      exerciseIndex: Number(sources.exerciseIndex.value) || 0,
      setIndex: Number(sources.setIndex.value) || 0,
      routineName: sources.routineName?.value || '',
      restEndsAt: restMs ? new Date(restMs).toISOString() : null,
    };
  }

  function showCue(cue) {
    if (!cue || !cue.body) return;
    activeCue.value = cue;
    if (cueClearTimer) clearTimeout(cueClearTimer);
    cueClearTimer = setTimeout(() => {
      if (activeCue.value?.id === cue.id) {
        activeCue.value = null;
      }
    }, 12_000);
  }

  function dismissCue() {
    activeCue.value = null;
    if (cueClearTimer) {
      clearTimeout(cueClearTimer);
      cueClearTimer = null;
    }
  }

  async function publish(force = false) {
    if (disposed || !shadowEnabled.value || !shadowAvailable.value) return;
    if (publishing.value) return;

    const phase = sources.phase.value;
    if (phase !== 'working' && phase !== 'resting') return;

    const now = Date.now();
    const fingerprint = buildFingerprint();
    const changed = fingerprint !== lastFingerprint;
    const dueHeartbeat = now - lastSentAt >= SNAPSHOT_MIN_MS;

    if (!force && !changed && !dueHeartbeat) return;

    publishing.value = true;
    try {
      const response = await patchWorkoutLive(buildPayload());
      lastSentAt = Date.now();
      lastFingerprint = fingerprint;
      wasLive = true;
      const cue = response.data?.data?.cue;
      if (cue) showCue(cue);
    } catch (error) {
      const code = error?.response?.status || error?.response?.data?.code;
      if (code === 503) {
        shadowAvailable.value = false;
      } else if (code === 403) {
        shadowEnabled.value = false;
      } else {
        console.warn('[shadow] snapshot falló:', error);
      }
    } finally {
      publishing.value = false;
    }
  }

  async function stopLive() {
    dismissCue();
    lastFingerprint = '';
    lastSentAt = 0;
    if (!wasLive || !shadowAvailable.value) {
      wasLive = false;
      return;
    }
    wasLive = false;
    try {
      await clearWorkoutLive();
    } catch (error) {
      console.warn('[shadow] clear live falló:', error);
    }
  }

  function startHeartbeat() {
    stopHeartbeat();
    heartbeatId = setInterval(() => {
      publish(false);
    }, SNAPSHOT_MIN_MS);
  }

  function stopHeartbeat() {
    if (heartbeatId) {
      clearInterval(heartbeatId);
      heartbeatId = null;
    }
  }

  watch(
    () => [sources.phase.value, sources.exerciseIndex.value, sources.setIndex.value],
    ([phase]) => {
      if (phase === 'working' || phase === 'resting') {
        publish(true);
        startHeartbeat();
      } else {
        stopHeartbeat();
        if (wasLive && (phase === 'finished' || phase === 'idle')) {
          stopLive();
        }
      }
    },
  );

  onUnmounted(() => {
    disposed = true;
    stopHeartbeat();
    if (wasLive) {
      stopLive();
    }
    if (cueClearTimer) clearTimeout(cueClearTimer);
  });

  return {
    shadowEnabled,
    shadowAvailable,
    activeCue,
    dismissCue,
    loadPreference,
    publish,
    stopLive,
  };
}
