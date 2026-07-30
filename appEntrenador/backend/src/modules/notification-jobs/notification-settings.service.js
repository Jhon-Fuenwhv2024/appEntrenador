const db = require('../../config/db');
const {
  DEFAULT_TIMEZONE,
  isValidTimeZone,
  normalizeTimeZone,
} = require('./timezone');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function mapSettingsRow(row) {
  return {
    workout_reminder_enabled: row.workout_reminder_enabled == null
      ? true
      : Boolean(row.workout_reminder_enabled),
    workout_reminder_hour: Number(row.workout_reminder_hour ?? 8),
    timezone: normalizeTimeZone(row.timezone || DEFAULT_TIMEZONE),
  };
}

const DEFAULTS = {
  workout_reminder_enabled: true,
  workout_reminder_hour: 8,
  timezone: DEFAULT_TIMEZONE,
};

/**
 * Ensure a settings row exists (defaults). Returns mapped settings.
 */
async function ensureDefaults(clientId) {
  await db.query(
    `INSERT INTO client_notification_settings
       (client_id, workout_reminder_enabled, workout_reminder_hour, timezone)
     VALUES (?, TRUE, 8, ?)
     ON DUPLICATE KEY UPDATE client_id = client_id`,
    [clientId, DEFAULT_TIMEZONE],
  );

  const [rows] = await db.query(
    `SELECT workout_reminder_enabled, workout_reminder_hour, timezone
     FROM client_notification_settings
     WHERE client_id = ?
     LIMIT 1`,
    [clientId],
  );

  return mapSettingsRow(rows[0] || DEFAULTS);
}

async function getForClient(clientId) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError('clientId inválido.', 400);
  }
  return ensureDefaults(id);
}

async function upsertForClient(clientId, payload = {}) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError('clientId inválido.', 400);
  }

  const current = await ensureDefaults(id);

  let enabled = current.workout_reminder_enabled;
  if (payload.workout_reminder_enabled !== undefined) {
    enabled = Boolean(payload.workout_reminder_enabled);
  }

  let hour = current.workout_reminder_hour;
  if (payload.workout_reminder_hour !== undefined && payload.workout_reminder_hour !== null) {
    hour = Number(payload.workout_reminder_hour);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      throw createHttpError('workout_reminder_hour debe ser un entero entre 0 y 23.', 400);
    }
  }

  let timezone = current.timezone;
  if (payload.timezone !== undefined && payload.timezone !== null) {
    const tz = String(payload.timezone).trim();
    if (!isValidTimeZone(tz)) {
      throw createHttpError('timezone IANA inválida.', 400);
    }
    timezone = tz;
  }

  await db.query(
    `INSERT INTO client_notification_settings
       (client_id, workout_reminder_enabled, workout_reminder_hour, timezone)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       workout_reminder_enabled = VALUES(workout_reminder_enabled),
       workout_reminder_hour = VALUES(workout_reminder_hour),
       timezone = VALUES(timezone)`,
    [id, enabled ? 1 : 0, hour, timezone],
  );

  return {
    workout_reminder_enabled: enabled,
    workout_reminder_hour: hour,
    timezone,
  };
}

module.exports = {
  ensureDefaults,
  getForClient,
  upsertForClient,
  mapSettingsRow,
  DEFAULTS,
};
