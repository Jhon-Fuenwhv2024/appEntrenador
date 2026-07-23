const db = require('../../config/db');
const clientsService = require('../clients/clients.service');
const { assertClientWritableUnderPlan } = require('../../shared/saas/trainerSeats');

const METRIC_FIELDS = [
  'body_fat_pct',
  'chest_cm',
  'waist_cm',
  'triceps_cm',
  'biceps_cm',
  'glutes_cm',
  'quads_cm',
  'calves_cm',
  'back_cm',
];

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * IMC = weight_kg / (height_cm / 100)^2, redondeado a 2 decimales.
 * Nunca confiar en un bmi enviado por el cliente.
 */
function calculateBmi(weightKg, heightCm) {
  const heightM = heightCm / 100;
  if (!Number.isFinite(heightM) || heightM <= 0) {
    return null;
  }
  const raw = weightKg / (heightM * heightM);
  if (!Number.isFinite(raw)) {
    return null;
  }
  return Math.round(raw * 100) / 100;
}

function parseRequiredDecimal(value, fieldLabel, { min, max }) {
  if (value === undefined || value === null || value === '') {
    throw createHttpError(`${fieldLabel} es obligatorio.`, 400);
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw createHttpError(`${fieldLabel} inválido.`, 400);
  }
  if (num < min || num > max) {
    throw createHttpError(`${fieldLabel} fuera de rango (${min}–${max}).`, 400);
  }
  return Math.round(num * 100) / 100;
}

function parseOptionalDecimal(value, fieldLabel, { min, max }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw createHttpError(`${fieldLabel} inválido.`, 400);
  }
  if (num < min || num > max) {
    throw createHttpError(`${fieldLabel} fuera de rango (${min}–${max}).`, 400);
  }
  return Math.round(num * 100) / 100;
}

function parseMeasuredAt(value) {
  if (value === undefined || value === null || value === '') {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const raw = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw createHttpError('measured_at debe ser una fecha YYYY-MM-DD.', 400);
  }
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw createHttpError('measured_at inválido.', 400);
  }
  return raw;
}

function parseNotes(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizePayload(payload) {
  // Ignorar cualquier bmi del body: siempre se recalcula en servidor.
  const weightKg = parseRequiredDecimal(payload.weight_kg, 'weight_kg', { min: 20, max: 400 });
  const heightCm = parseRequiredDecimal(payload.height_cm, 'height_cm', { min: 50, max: 280 });
  const measuredAt = parseMeasuredAt(payload.measured_at);
  const notes = parseNotes(payload.notes);

  const metrics = {};
  for (const field of METRIC_FIELDS) {
    const max = field === 'body_fat_pct' ? 80 : 300;
    metrics[field] = parseOptionalDecimal(payload[field], field, { min: 0, max });
  }

  const bmi = calculateBmi(weightKg, heightCm);

  return {
    measured_at: measuredAt,
    weight_kg: weightKg,
    height_cm: heightCm,
    bmi,
    notes,
    ...metrics,
  };
}

const SELECT_COLUMNS = `
  id, client_id, recorded_by, measured_at,
  weight_kg, height_cm, body_fat_pct, bmi,
  chest_cm, waist_cm, triceps_cm, biceps_cm,
  glutes_cm, quads_cm, calves_cm, back_cm,
  notes, created_at, updated_at
`;

async function getLogById(logId) {
  const [rows] = await db.query(
    `SELECT ${SELECT_COLUMNS}
     FROM body_composition_logs
     WHERE id = ?
     LIMIT 1`,
    [logId],
  );
  return rows[0] || null;
}

async function listLogsForClient(clientId) {
  const [rows] = await db.query(
    `SELECT ${SELECT_COLUMNS}
     FROM body_composition_logs
     WHERE client_id = ?
     ORDER BY measured_at DESC, id DESC`,
    [clientId],
  );
  return rows;
}

async function listForClientAsTrainer(trainerId, clientId) {
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
  return listLogsForClient(clientId);
}

async function listMine(clientId) {
  return listLogsForClient(clientId);
}

async function createForClient(trainerId, clientId, payload) {
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
  await assertClientWritableUnderPlan(trainerId, clientId);
  const data = normalizePayload(payload);

  const [result] = await db.query(
    `INSERT INTO body_composition_logs (
      client_id, recorded_by, measured_at,
      weight_kg, height_cm, body_fat_pct, bmi,
      chest_cm, waist_cm, triceps_cm, biceps_cm,
      glutes_cm, quads_cm, calves_cm, back_cm,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clientId,
      trainerId,
      data.measured_at,
      data.weight_kg,
      data.height_cm,
      data.body_fat_pct,
      data.bmi,
      data.chest_cm,
      data.waist_cm,
      data.triceps_cm,
      data.biceps_cm,
      data.glutes_cm,
      data.quads_cm,
      data.calves_cm,
      data.back_cm,
      data.notes,
    ],
  );

  return getLogById(result.insertId);
}

async function updateForClient(trainerId, clientId, logId, payload) {
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
  await assertClientWritableUnderPlan(trainerId, clientId);

  const existing = await getLogById(logId);
  if (!existing || Number(existing.client_id) !== Number(clientId)) {
    throw createHttpError('Medición no encontrada.', 404);
  }

  const data = normalizePayload(payload);

  await db.query(
    `UPDATE body_composition_logs SET
      measured_at = ?,
      weight_kg = ?,
      height_cm = ?,
      body_fat_pct = ?,
      bmi = ?,
      chest_cm = ?,
      waist_cm = ?,
      triceps_cm = ?,
      biceps_cm = ?,
      glutes_cm = ?,
      quads_cm = ?,
      calves_cm = ?,
      back_cm = ?,
      notes = ?
     WHERE id = ? AND client_id = ?`,
    [
      data.measured_at,
      data.weight_kg,
      data.height_cm,
      data.body_fat_pct,
      data.bmi,
      data.chest_cm,
      data.waist_cm,
      data.triceps_cm,
      data.biceps_cm,
      data.glutes_cm,
      data.quads_cm,
      data.calves_cm,
      data.back_cm,
      data.notes,
      logId,
      clientId,
    ],
  );

  return getLogById(logId);
}

module.exports = {
  calculateBmi,
  listForClientAsTrainer,
  listMine,
  createForClient,
  updateForClient,
};
