import { computed, onMounted, onUnmounted, readonly, shallowRef } from 'vue';
import restCompleteUrl from '../../../assets/sounds/rest-complete.wav';

/**
 * Background-resilient countdown based on targetEndTime (wall clock),
 * not on decrementing ticks. Interval only refreshes the UI.
 *
 * @param {{ onComplete?: () => void }} [options]
 */
export function useTimer(options = {}) {
  const secondsLeft = shallowRef(0);
  const isRunning = shallowRef(false);
  const targetEndTime = shallowRef(null);

  let tickId = null;
  let audioEl = null;
  let completeHandler = options.onComplete ?? null;
  let completedFired = false;

  const formattedTime = computed(() => {
    const total = Math.max(0, secondsLeft.value);
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  function ensureAudio() {
    if (!audioEl) {
      audioEl = new Audio(restCompleteUrl);
      audioEl.preload = 'auto';
    }
    return audioEl;
  }

  /**
   * Unlock HTMLAudioElement during a user gesture (autoplay policy).
   * Call from "Comenzar entrenamiento" / first tap.
   */
  function unlockAudio() {
    const audio = ensureAudio();
    audio.muted = true;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        })
        .catch((error) => {
          console.warn('No se pudo desbloquear el audio de descanso:', error);
          audio.muted = false;
        });
    } else {
      audio.muted = false;
    }
  }

  function playAlert() {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([180, 80, 180]);
      }
    } catch {
      // Vibration is optional; ignore unsupported environments.
    }

    const audio = ensureAudio();
    audio.currentTime = 0;
    audio.play().catch((error) => console.warn(error));
  }

  function clearTick() {
    if (tickId != null) {
      clearInterval(tickId);
      tickId = null;
    }
  }

  function fireComplete() {
    if (completedFired) return;
    completedFired = true;
    playAlert();
    completeHandler?.();
  }

  /**
   * Recompute remaining time from wall clock.
   * If already past targetEndTime, stop at 0 and run the alert.
   */
  function syncFromTimestamp() {
    if (!isRunning.value || targetEndTime.value == null) return;

    const remainingMs = targetEndTime.value - Date.now();
    if (remainingMs <= 0) {
      secondsLeft.value = 0;
      clearTick();
      isRunning.value = false;
      targetEndTime.value = null;
      fireComplete();
      return;
    }

    secondsLeft.value = Math.ceil(remainingMs / 1000);
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      syncFromTimestamp();
    }
  }

  /**
   * @param {number} durationSeconds
   * @param {{ onComplete?: () => void }} [startOptions]
   */
  function start(durationSeconds, startOptions = {}) {
    clearTick();
    completedFired = false;

    if (typeof startOptions.onComplete === 'function') {
      completeHandler = startOptions.onComplete;
    }

    const duration = Math.max(0, Math.round(Number(durationSeconds) || 0));
    if (duration <= 0) {
      secondsLeft.value = 0;
      isRunning.value = false;
      targetEndTime.value = null;
      fireComplete();
      return;
    }

    targetEndTime.value = Date.now() + duration * 1000;
    secondsLeft.value = duration;
    isRunning.value = true;
    // Sub-second tick keeps MM:SS accurate after throttled background intervals.
    tickId = setInterval(syncFromTimestamp, 250);
  }

  /** Cancel without firing the completion alert. */
  function cancel() {
    clearTick();
    isRunning.value = false;
    targetEndTime.value = null;
    secondsLeft.value = 0;
    completedFired = false;
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    clearTick();
  });

  return {
    secondsLeft: readonly(secondsLeft),
    isRunning: readonly(isRunning),
    targetEndTime: readonly(targetEndTime),
    formattedTime,
    start,
    cancel,
    unlockAudio,
    playAlert,
    syncFromTimestamp,
  };
}
