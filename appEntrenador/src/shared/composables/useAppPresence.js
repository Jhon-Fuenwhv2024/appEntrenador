/**
 * Reports "app is visible" to the API so chat push can be skipped.
 * Heartbeat while document is visible; clear when hidden / unmount / logout.
 */
import { onMounted, onUnmounted } from 'vue';
import { clearPushPresence, touchPushPresence } from '../api/pushApi.js';
import { isAuthenticated } from '../auth/session.js';

const HEARTBEAT_MS = 20_000;

let heartbeatTimer = null;
let started = false;
let listenerBound = false;

async function ping() {
  if (!isAuthenticated()) return;
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    return;
  }
  try {
    await touchPushPresence();
  } catch (error) {
    // Soft-fail: offline / 401 should not break the shell.
    console.warn('[presence] ping failed:', error?.message || error);
  }
}

async function markAway() {
  if (!isAuthenticated()) return;
  try {
    await clearPushPresence();
  } catch {
    // ignore
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    ping();
    startHeartbeat();
  } else {
    stopHeartbeat();
    markAway();
  }
}

function startHeartbeat() {
  if (heartbeatTimer != null) return;
  heartbeatTimer = setInterval(() => {
    ping();
  }, HEARTBEAT_MS);
}

function stopHeartbeat() {
  if (heartbeatTimer != null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function bindListeners() {
  if (listenerBound || typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', ping);
  listenerBound = true;
}

function unbindListeners() {
  if (!listenerBound || typeof document === 'undefined') return;
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('focus', ping);
  listenerBound = false;
}

/**
 * Call from AppShell. Starts presence while the authenticated shell is mounted.
 */
export function useAppPresence() {
  onMounted(() => {
    if (started) {
      ping();
      return;
    }
    started = true;
    bindListeners();
    if (document.visibilityState === 'visible') {
      ping();
      startHeartbeat();
    }
  });

  onUnmounted(() => {
    // Multiple shells shouldn't exist; still be safe if remounting.
    stopHeartbeat();
    markAway();
    unbindListeners();
    started = false;
  });

  return {
    ping,
    markAway,
  };
}

/** For logout paths outside the composable lifecycle. */
export async function clearAppPresence() {
  stopHeartbeat();
  await markAway();
}
