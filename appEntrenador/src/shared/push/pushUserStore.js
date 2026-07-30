/**
 * Persist the Trainfit user id that owns this browser's Web Push subscription.
 * Service workers cannot read localStorage — IndexedDB is shared with the SW.
 * Feature 051 — prevents showing another user's push on a shared device.
 */

const DB_NAME = 'trainfit-push';
const DB_VERSION = 1;
const STORE = 'session';
const KEY = 'pushUserId';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error || new Error('indexedDB open failed'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

export async function setPushUserId(userId) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id < 1) {
    await clearPushUserId();
    return;
  }
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).put(id, KEY);
  });
  db.close();
}

export async function getPushUserId() {
  const db = await openDb();
  const value = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    tx.onerror = () => reject(tx.error);
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result);
  });
  db.close();
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function clearPushUserId() {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).delete(KEY);
  });
  db.close();
}
