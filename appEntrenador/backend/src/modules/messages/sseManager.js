/**
 * In-memory SSE connection registry.
 * Key: userId (number), Value: Express `res` for the open event-stream.
 * Feature 034 — single-process only (no Redis / multi-instance fan-out).
 */
const clients = new Map();

function addClient(userId, res) {
  const id = Number(userId);
  const existing = clients.get(id);

  if (existing && existing !== res) {
    try {
      existing.end();
    } catch {
      // Connection may already be closed.
    }
  }

  clients.set(id, res);
}

function removeClient(userId, res) {
  const id = Number(userId);
  const current = clients.get(id);

  if (current === res || current == null) {
    clients.delete(id);
  }
}

function getClient(userId) {
  return clients.get(Number(userId)) || null;
}

/**
 * Push a JSON payload to a connected SSE client.
 * @returns {boolean} true if the write succeeded
 */
function sendToUser(userId, payload) {
  const res = getClient(userId);
  if (!res) return false;

  try {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    return true;
  } catch (error) {
    console.error('SSE write failed for user', userId, error.message);
    removeClient(userId, res);
    return false;
  }
}

function getConnectedCount() {
  return clients.size;
}

module.exports = {
  addClient,
  removeClient,
  getClient,
  sendToUser,
  getConnectedCount,
};
