/**
 * In-memory "app is open / visible" presence for suppressing chat push.
 * Same process limits as SSE (Feature 034) — single Node instance.
 */
const lastSeenAt = new Map();

/** Consider user "in app" if heartbeat within this window. */
const ACTIVE_WINDOW_MS = 45_000;

function touch(userId) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id < 1) return false;
  lastSeenAt.set(id, Date.now());
  return true;
}

function clear(userId) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id < 1) return;
  lastSeenAt.delete(id);
}

function isActive(userId, maxAgeMs = ACTIVE_WINDOW_MS) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id < 1) return false;
  const ts = lastSeenAt.get(id);
  if (ts == null) return false;
  return Date.now() - ts < maxAgeMs;
}

module.exports = {
  touch,
  clear,
  isActive,
  ACTIVE_WINDOW_MS,
};
