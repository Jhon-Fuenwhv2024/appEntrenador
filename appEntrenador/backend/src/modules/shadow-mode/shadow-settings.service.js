const db = require('../../config/db');
const { DEFAULT_TIMEZONE } = require('../notification-jobs/timezone');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function mapShadowSettings(row) {
  return {
    shadow_mode_enabled: row?.shadow_mode_enabled == null
      ? true
      : Boolean(Number(row.shadow_mode_enabled)),
  };
}

/**
 * Ensure settings row exists; returns shadow preference (default ON).
 */
async function getForClient(clientId) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError('clientId inválido.', 400);
  }

  await db.query(
    `INSERT INTO client_notification_settings
       (client_id, workout_reminder_enabled, workout_reminder_hour, timezone, shadow_mode_enabled)
     VALUES (?, TRUE, 8, ?, TRUE)
     ON DUPLICATE KEY UPDATE client_id = client_id`,
    [id, DEFAULT_TIMEZONE],
  );

  const [rows] = await db.query(
    `SELECT shadow_mode_enabled
     FROM client_notification_settings
     WHERE client_id = ?
     LIMIT 1`,
    [id],
  );

  return mapShadowSettings(rows[0]);
}

/**
 * @returns {Promise<boolean>}
 */
async function isShadowEnabled(clientId) {
  const settings = await getForClient(clientId);
  return settings.shadow_mode_enabled;
}

async function upsertForClient(clientId, payload = {}) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError('clientId inválido.', 400);
  }

  if (payload.shadow_mode_enabled === undefined) {
    throw createHttpError('shadow_mode_enabled es obligatorio.', 400);
  }

  const enabled = Boolean(payload.shadow_mode_enabled);

  await db.query(
    `INSERT INTO client_notification_settings
       (client_id, workout_reminder_enabled, workout_reminder_hour, timezone, shadow_mode_enabled)
     VALUES (?, TRUE, 8, ?, ?)
     ON DUPLICATE KEY UPDATE
       shadow_mode_enabled = VALUES(shadow_mode_enabled)`,
    [id, DEFAULT_TIMEZONE, enabled ? 1 : 0],
  );

  return { shadow_mode_enabled: enabled };
}

module.exports = {
  getForClient,
  upsertForClient,
  isShadowEnabled,
  mapShadowSettings,
};
