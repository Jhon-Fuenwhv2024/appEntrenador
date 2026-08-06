/**
 * Shared IndexedDB for client offline workout data (Features 086 + 088).
 * DB: trainfit-offline
 *   v1 — pending_workout_sessions (completed sessions awaiting sync)
 *   v2 — active_workout_draft (in-progress session crash recovery)
 */

export const OFFLINE_DB_NAME = 'trainfit-offline';
export const OFFLINE_DB_VERSION = 2;

export const PENDING_SESSIONS_STORE = 'pending_workout_sessions';
export const ACTIVE_DRAFT_STORE = 'active_workout_draft';

/**
 * @returns {Promise<IDBDatabase>}
 */
export function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
    request.onerror = () => reject(request.error || new Error('idb open failed'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion || 0;

      if (oldVersion < 1 || !db.objectStoreNames.contains(PENDING_SESSIONS_STORE)) {
        const store = db.createObjectStore(PENDING_SESSIONS_STORE, { keyPath: 'id' });
        store.createIndex('by_routine_started', ['routine_id', 'started_at'], { unique: false });
      }

      if (oldVersion < 2 || !db.objectStoreNames.contains(ACTIVE_DRAFT_STORE)) {
        db.createObjectStore(ACTIVE_DRAFT_STORE, { keyPath: 'clientId' });
      }
    };
  });
}

/**
 * @template T
 * @param {string} storeName
 * @param {IDBTransactionMode} mode
 * @param {(store: IDBObjectStore) => Promise<T>|T} fn
 * @returns {Promise<T>}
 */
export function withOfflineStore(storeName, mode, fn) {
  return openOfflineDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    tx.oncomplete = () => {
      db.close();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    Promise.resolve(fn(tx.objectStore(storeName)))
      .then(resolve)
      .catch(reject);
  }));
}
