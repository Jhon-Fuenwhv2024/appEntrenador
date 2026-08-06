/**
 * In-progress workout draft for crash recovery (Feature 088).
 * One draft per clientId in IndexedDB trainfit-offline / active_workout_draft.
 */

import {
  ACTIVE_DRAFT_STORE,
  withOfflineStore,
} from './offlineDb.js';

/**
 * @typedef {object} ActiveWorkoutDraft
 * @property {number} clientId
 * @property {number} routineId
 * @property {string} routineName
 * @property {object} routineSnapshot
 * @property {number} exerciseIndex
 * @property {number} setIndex
 * @property {'working'|'resting'} phase
 * @property {Array<{ exerciseId: number|null, exerciseName: string, setNumber: number, weight: number, reps: number }>} logs
 * @property {string} startedAt
 * @property {string|null} restEndsAt
 * @property {number|null} restDuration
 * @property {{ exerciseIndex: number, setIndex: number }|null} restTarget
 * @property {string} updatedAt
 */

/**
 * @param {number} clientId
 * @returns {Promise<ActiveWorkoutDraft|null>}
 */
export async function getActiveWorkoutDraft(clientId) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id < 1) return null;

  try {
    const row = await withOfflineStore(ACTIVE_DRAFT_STORE, 'readonly', (store) => new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    }));
    if (!row || !row.routineSnapshot) return null;
    if (row.phase !== 'working' && row.phase !== 'resting') return null;
    return row;
  } catch (error) {
    console.warn('[activeWorkoutDraft] get failed:', error);
    return null;
  }
}

/**
 * @param {ActiveWorkoutDraft} draft
 * @returns {Promise<void>}
 */
export async function saveActiveWorkoutDraft(draft) {
  const clientId = Number(draft?.clientId);
  if (!Number.isInteger(clientId) || clientId < 1) return;
  if (draft.phase !== 'working' && draft.phase !== 'resting') return;

  const entry = {
    clientId,
    routineId: Number(draft.routineId),
    routineName: typeof draft.routineName === 'string' ? draft.routineName : '',
    routineSnapshot: draft.routineSnapshot,
    exerciseIndex: Math.max(0, Number(draft.exerciseIndex) || 0),
    setIndex: Math.max(0, Number(draft.setIndex) || 0),
    phase: draft.phase,
    logs: Array.isArray(draft.logs) ? draft.logs : [],
    startedAt: draft.startedAt || new Date().toISOString(),
    restEndsAt: draft.restEndsAt ?? null,
    restDuration: draft.restDuration ?? null,
    restTarget: draft.restTarget ?? null,
    updatedAt: new Date().toISOString(),
  };

  await withOfflineStore(ACTIVE_DRAFT_STORE, 'readwrite', (store) => new Promise((resolve, reject) => {
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

/**
 * @param {number} clientId
 * @returns {Promise<void>}
 */
export async function clearActiveWorkoutDraft(clientId) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id < 1) return;

  try {
    await withOfflineStore(ACTIVE_DRAFT_STORE, 'readwrite', (store) => new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }));
  } catch (error) {
    console.warn('[activeWorkoutDraft] clear failed:', error);
  }
}
