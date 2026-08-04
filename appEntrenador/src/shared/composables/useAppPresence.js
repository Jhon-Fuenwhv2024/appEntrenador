/**
 * Reports "app is visible" to the API so chat push can be skipped.
 * Heartbeat while document is visible; clear when hidden / unmount / logout.
 */
import { onMounted, onUnmounted } from 'vue';
import { clearPushPresence, touchPushPresence } from '../api/pushApi.js';
import { refreshSessionTokens } from '../api/http.js';
import { getAuthToken, getRefreshToken, isAuthenticated } from '../auth/session.js';

const HEARTBEAT_MS = 20_000;

let heartbeatTimer = null;
let started = false;
let listenerBound = false;

/** True if access JWT is missing or expires within skewSec (no signature check). */
function isAccessExpiredSoon(skewSec = 90) {
  const token = getAuthToken();
  if (!token) return true;
  try {
    const [, payloadPart] = token.split('.');
    if (!payloadPart) return true;
    const json = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    if (!payload?.exp) return true;
    return payload.exp * 1000 <= Date.now() + skewSec * 1000;
  } catch {
    return true;
  }
}

async function ensureFreshAccess() {
  if (!isAuthenticated() || !getRefreshToken()) return;
  if (!isAccessExpiredSoon()) return;
  try {
    await refreshSessionTokens();
  } catch {
    // Soft: interceptor / login flow handles hard failures.
  }
}

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
    // Renew access before presence / other calls after tab switch.
    ensureFreshAccess().finally(() => {
      ping();
      startHeartbeat();
    });
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

function onPageHide() {
  stopHeartbeat();
  markAway();
}

function bindListeners() {
  if (listenerBound || typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', ping);
  window.addEventListener('pagehide', onPageHide);
  listenerBound = true;
}

function unbindListeners() {
  if (!listenerBound || typeof document === 'undefined') return;
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('focus', ping);
  window.removeEventListener('pagehide', onPageHide);
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
