/**
 * Flush pending offline workout sessions when back online (Feature 086).
 */
import { onMounted, readonly, shallowRef } from 'vue';
import { getApiErrorMessage, isMembershipBlockedError } from '../../../shared/api/http.js';
import { createMyWorkoutSession, getMyWorkoutSessions } from '../api/workoutSessionsApi.js';
import {
  listPendingWorkoutSessions,
  removePendingWorkoutSession,
} from '../utils/offlineWorkoutQueue.js';

const pendingCount = shallowRef(0);
const syncing = shallowRef(false);
const lastSyncError = shallowRef('');

let flushInFlight = null;
let onlineListenerBound = false;

function isNetworkError(error) {
  if (!error) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  if (!error.response && (error.request || error.code === 'ERR_NETWORK')) return true;
  const status = error.response?.status;
  return status === 0 || status === 408 || status === 502 || status === 503 || status === 504;
}

async function refreshCount() {
  try {
    pendingCount.value = (await listPendingWorkoutSessions()).length;
  } catch {
    pendingCount.value = 0;
  }
}

/**
 * True if a completed session with same routine + started_at already exists remotely.
 */
async function alreadySyncedRemotely(payload) {
  try {
    const res = await getMyWorkoutSessions();
    const list = res.data?.data ?? [];
    const started = payload.started_at;
    const routineId = Number(payload.routine_id);
    return list.some((session) => {
      if (session.status !== 'completed') return false;
      if (Number(session.routine_id) !== routineId) return false;
      return String(session.started_at || '') === String(started || '');
    });
  } catch {
    return false;
  }
}

async function flushOnce() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    await refreshCount();
    return { flushed: 0, remaining: pendingCount.value };
  }

  const queue = await listPendingWorkoutSessions();
  if (!queue.length) {
    pendingCount.value = 0;
    return { flushed: 0, remaining: 0 };
  }

  syncing.value = true;
  lastSyncError.value = '';
  let flushed = 0;

  try {
    for (const entry of queue) {
      const payload = entry.payload;
      try {
        if (await alreadySyncedRemotely(payload)) {
          await removePendingWorkoutSession(entry.id);
          flushed += 1;
          continue;
        }
        await createMyWorkoutSession(payload);
        await removePendingWorkoutSession(entry.id);
        flushed += 1;
      } catch (error) {
        if (isMembershipBlockedError(error)) {
          await removePendingWorkoutSession(entry.id);
          lastSyncError.value = getApiErrorMessage(
            error,
            'Tu membresía bloquea guardar entrenamientos pendientes.',
          );
          continue;
        }
        if (isNetworkError(error)) {
          lastSyncError.value = 'Sin conexión; se reintentará al volver online.';
          break;
        }
        console.warn('[offlineWorkout] drop non-retryable:', error);
        await removePendingWorkoutSession(entry.id);
        lastSyncError.value = getApiErrorMessage(error, 'No se pudo sincronizar un entrenamiento.');
      }
    }
  } finally {
    syncing.value = false;
    await refreshCount();
  }

  return { flushed, remaining: pendingCount.value };
}

export function flushPendingWorkoutSessions() {
  if (flushInFlight) return flushInFlight;
  flushInFlight = flushOnce().finally(() => {
    flushInFlight = null;
  });
  return flushInFlight;
}

function onOnline() {
  flushPendingWorkoutSessions().catch((error) => {
    console.warn('[offlineWorkout] flush on online:', error);
  });
}

function ensureOnlineListener() {
  if (onlineListenerBound || typeof window === 'undefined') return;
  window.addEventListener('online', onOnline);
  onlineListenerBound = true;
}

/**
 * Call from AppShell and/or WorkoutPlayerView.
 * Online listener is process-wide (safe with multiple mounts).
 */
export function useOfflineWorkoutSync() {
  onMounted(() => {
    ensureOnlineListener();
    refreshCount();
    flushPendingWorkoutSessions().catch((error) => {
      console.warn('[offlineWorkout] flush on mount:', error);
    });
  });

  return {
    pendingCount: readonly(pendingCount),
    syncing: readonly(syncing),
    lastSyncError: readonly(lastSyncError),
    flushPendingWorkoutSessions,
    refreshCount,
  };
}

export { isNetworkError, pendingCount, refreshCount };
