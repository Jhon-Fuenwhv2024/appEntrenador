const db = require('../../config/db');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function createHttpError(message, code, errorKey) {
  const error = new Error(message);
  error.code = code;
  if (errorKey) error.error = errorKey;
  return error;
}

function formatDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (!str) return null;
  return str.slice(0, 10);
}

function normalizeGymName(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.length > 120) {
    throw createHttpError('El nombre del gym no puede superar 120 caracteres.', 400);
  }
  return trimmed;
}

function parseExpiresOn(value) {
  if (value == null || value === '') {
    throw createHttpError('La fecha de vencimiento es obligatoria.', 400);
  }
  const dateStr = formatDateOnly(value);
  if (!dateStr || !DATE_RE.test(dateStr)) {
    throw createHttpError('Fecha inválida. Usa el formato YYYY-MM-DD.', 400);
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    Number.isNaN(dt.getTime())
    || dt.getUTCFullYear() !== y
    || dt.getUTCMonth() !== m - 1
    || dt.getUTCDate() !== d
  ) {
    throw createHttpError('Fecha inválida. Usa el formato YYYY-MM-DD.', 400);
  }
  return dateStr;
}

function parseNotifyEnabled(value, fallback = true) {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (value === 0 || value === '0' || value === 'false') return false;
  if (value === 1 || value === '1' || value === 'true') return true;
  throw createHttpError('notify_enabled debe ser boolean.', 400);
}

function mapRow(row) {
  if (!row) return null;
  const expiresOn = formatDateOnly(row.expires_on);
  const daysRemaining = row.days_remaining != null
    ? Number(row.days_remaining)
    : null;
  return {
    gym_name: row.gym_name ?? null,
    expires_on: expiresOn,
    days_remaining: Number.isFinite(daysRemaining) ? daysRemaining : null,
    notify_enabled: Boolean(Number(row.notify_enabled)),
  };
}

/**
 * Membresía del gym del cliente autenticado (Feature 082).
 * Ownership estricto: solo clientId === req.user.id (pasado por el controller).
 */
async function getForClient(clientId) {
  const id = Number(clientId);
  if (!Number.isFinite(id) || id <= 0) {
    throw createHttpError('Cliente inválido.', 400);
  }

  const [rows] = await db.query(
    `SELECT gym_name, expires_on, notify_enabled,
            DATEDIFF(expires_on, CURDATE()) AS days_remaining
     FROM client_gym_memberships
     WHERE client_id = ?
     LIMIT 1`,
    [id],
  );

  return mapRow(rows[0] || null);
}

async function upsertForClient(clientId, body = {}) {
  const id = Number(clientId);
  if (!Number.isFinite(id) || id <= 0) {
    throw createHttpError('Cliente inválido.', 400);
  }

  const gymName = normalizeGymName(body.gym_name);
  const expiresOn = parseExpiresOn(body.expires_on);

  const [existing] = await db.query(
    `SELECT notify_enabled FROM client_gym_memberships WHERE client_id = ? LIMIT 1`,
    [id],
  );
  const currentNotify = existing[0]
    ? Boolean(Number(existing[0].notify_enabled))
    : true;
  const notifyEnabled = parseNotifyEnabled(body.notify_enabled, currentNotify);

  await db.query(
    `INSERT INTO client_gym_memberships (client_id, gym_name, expires_on, notify_enabled)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       gym_name = VALUES(gym_name),
       expires_on = VALUES(expires_on),
       notify_enabled = VALUES(notify_enabled)`,
    [id, gymName, expiresOn, notifyEnabled ? 1 : 0],
  );

  return getForClient(id);
}

async function deleteForClient(clientId) {
  const id = Number(clientId);
  if (!Number.isFinite(id) || id <= 0) {
    throw createHttpError('Cliente inválido.', 400);
  }

  const [result] = await db.query(
    `DELETE FROM client_gym_memberships WHERE client_id = ?`,
    [id],
  );

  if (!result.affectedRows) {
    throw createHttpError('No tienes membresía de gym configurada.', 404);
  }

  return null;
}

module.exports = {
  getForClient,
  upsertForClient,
  deleteForClient,
};
