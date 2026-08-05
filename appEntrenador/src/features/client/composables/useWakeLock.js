/**
 * Screen Wake Lock while an active workout keeps the display on (Feature 086).
 * Degrades silently when the API is missing or the request fails.
 */
import { onUnmounted, readonly, shallowRef, watch } from 'vue';

/**
 * @param {import('vue').Ref<string>|import('vue').ComputedRef<string>} phaseRef
 *   Expected phases: idle | working | resting | finished
 */
export function useWakeLock(phaseRef) {
  const active = shallowRef(false);
  let sentinel = null;
  let releasedByUs = false;

  function isSupported() {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  async function release() {
    releasedByUs = true;
    const current = sentinel;
    sentinel = null;
    active.value = false;
    if (!current) return;
    try {
      await current.release();
    } catch {
      // already released by the browser
    }
  }

  async function request() {
    if (!isSupported()) return false;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return false;
    }
    try {
      // Release previous before re-request (visibility resume).
      if (sentinel) {
        await release();
      }
      releasedByUs = false;
      sentinel = await navigator.wakeLock.request('screen');
      active.value = true;
      sentinel.addEventListener('release', () => {
        if (!releasedByUs) {
          active.value = false;
          sentinel = null;
        }
      });
      return true;
    } catch (error) {
      active.value = false;
      sentinel = null;
      console.warn('[wakeLock] request failed:', error?.message || error);
      return false;
    }
  }

  async function syncWithPhase() {
    const phase = phaseRef?.value;
    if (phase === 'working' || phase === 'resting') {
      await request();
      return;
    }
    await release();
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      syncWithPhase();
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  const stopWatch = watch(phaseRef, () => {
    syncWithPhase();
  }, { immediate: true });

  onUnmounted(() => {
    stopWatch();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
    release();
  });

  return {
    supported: isSupported(),
    active: readonly(active),
    request,
    release,
    syncWithPhase,
  };
}
