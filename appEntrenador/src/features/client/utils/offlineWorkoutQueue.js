/**
 * IndexedDB queue for completed workout sessions when offline (Feature 086).
 * No MySQL schema change: dedup by routine_id + started_at on flush.
 */

const DB_NAME = 'trainfit-offline';
const DB_VERSION = 1;
const STORE = 'pending_workout_sessions';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error || new Error('idb open failed'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('by_routine_started', ['routine_id', 'started_at'], { unique: false });
      }
    };
  });
}

function withStore(mode, fn) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    tx.oncomplete = () => {
      db.close();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    Promise.resolve(fn(tx.objectStore(STORE)))
      .then(resolve)
      .catch(reject);
  }));
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * @param {object} payload Same shape as POST /me/workout-sessions body
 * @returns {Promise<{ id: string }>}
 */
export async function enqueueWorkoutSession(payload) {
  const entry = {
    id: makeId(),
    queued_at: new Date().toISOString(),
    payload: {
      routine_id: Number(payload.routine_id),
      routine_name: payload.routine_name || '',
      started_at: payload.started_at,
      status: payload.status || 'completed',
      sets: Array.isArray(payload.sets) ? payload.sets : [],
    },
  };

  await withStore('readwrite', (store) => new Promise((resolve, reject) => {
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));

  return { id: entry.id };
}

/** @returns {Promise<Array<{ id: string, queued_at: string, payload: object }>>} */
export async function listPendingWorkoutSessions() {
  return withStore('readonly', (store) => new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
    req.onerror = () => reject(req.error);
  }));
}

/** @param {string} id */
export async function removePendingWorkoutSession(id) {
  if (!id) return;
  await withStore('readwrite', (store) => new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

/** @returns {Promise<number>} */
export async function countPendingWorkoutSessions() {
  const list = await listPendingWorkoutSessions();
  return list.length;
}
