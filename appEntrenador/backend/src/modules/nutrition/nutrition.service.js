const db = require('../../config/db');
const clientsService = require('../clients/clients.service');
const { caloriesFromMacros } = require('./macros');

const SELECT_COLUMNS = `
  id, client_id, trainer_id, calories, protein_g, carbs_g, fats_g,
  created_at, updated_at
`;

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Entero positivo (INT >= 1).
 * Acepta number o string; redondea valores casi-enteros de inputs HTML.
 */
function parsePositiveInt(value, fieldLabel) {
  if (value === undefined || value === null || value === '') {
    throw createHttpError(`${fieldLabel} es obligatorio.`, 400);
  }
  const num = Math.round(Number(value));
  if (!Number.isFinite(num) || num < 1) {
    throw createHttpError(`${fieldLabel} debe ser un número entero positivo.`, 400);
  }
  return num;
}

function normalizePayload(payload) {
  const protein_g = parsePositiveInt(payload.protein_g, 'protein_g');
  const carbs_g = parsePositiveInt(payload.carbs_g, 'carbs_g');
  const fats_g = parsePositiveInt(payload.fats_g, 'fats_g');

  // Si no envían calories (o vienen vacías), calcular con Atwater 4-4-9.
  let calories;
  if (payload.calories === undefined || payload.calories === null || payload.calories === '') {
    calories = caloriesFromMacros(protein_g, carbs_g, fats_g);
  } else {
    calories = parsePositiveInt(payload.calories, 'calories');
  }

  if (calories < 1) {
    throw createHttpError('calories debe ser un número entero positivo.', 400);
  }

  return {
    calories,
    protein_g,
    carbs_g,
    fats_g,
  };
}

async function getByClientId(clientId) {
  const [rows] = await db.query(
    `SELECT ${SELECT_COLUMNS}
     FROM nutrition_targets
     WHERE client_id = ?
     LIMIT 1`,
    [clientId],
  );
  return rows[0] || null;
}

/**
 * GET: trainer dueño del cliente, o el propio cliente.
 */
async function getForRequester(requester, clientId) {
  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw createHttpError('clientId inválido.', 400);
  }

  if (requester.rol === 'trainer') {
    await clientsService.getClientOwnedByTrainer(clientId, requester.id);
  } else if (requester.rol === 'client') {
    if (Number(requester.id) !== Number(clientId)) {
      throw createHttpError('No autorizado a ver objetivos de otro cliente.', 403);
    }
  } else {
    throw createHttpError('Rol no autorizado.', 403);
  }

  const target = await getByClientId(clientId);
  // Empty plan is a valid state (trainer still filling the form) — not an error.
  return target || null;
}

/**
 * PUT (UPSERT): solo el trainer dueño del cliente.
 */
async function upsertForTrainer(trainerId, clientId, payload) {
  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw createHttpError('clientId inválido.', 400);
  }

  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
  const data = normalizePayload(payload || {});

  await db.query(
    `INSERT INTO nutrition_targets (
      client_id, trainer_id, calories, protein_g, carbs_g, fats_g
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      trainer_id = VALUES(trainer_id),
      calories = VALUES(calories),
      protein_g = VALUES(protein_g),
      carbs_g = VALUES(carbs_g),
      fats_g = VALUES(fats_g)`,
    [
      clientId,
      trainerId,
      data.calories,
      data.protein_g,
      data.carbs_g,
      data.fats_g,
    ],
  );

  return getByClientId(clientId);
}

/**
 * Feature 043: al activar un plan de dieta, refleja sus totales en objetivos diarios.
 * No requiere plan de comidas para usar upsertForTrainer a mano (031 sigue independiente).
 */
function roundMacroToPositiveInt(value, fieldLabel) {
  const num = Math.round(Number(value));
  if (!Number.isFinite(num) || num < 1) {
    throw createHttpError(
      `No se pueden sincronizar objetivos: ${fieldLabel} del plan debe ser ≥ 1.`,
      400,
    );
  }
  return num;
}

async function syncFromDietPlanTotals(trainerId, clientId, totals = {}) {
  const payload = {
    calories: roundMacroToPositiveInt(totals.calories, 'calories'),
    protein_g: roundMacroToPositiveInt(totals.protein_g, 'protein_g'),
    carbs_g: roundMacroToPositiveInt(totals.carbs_g, 'carbs_g'),
    fats_g: roundMacroToPositiveInt(totals.fats_g, 'fats_g'),
  };
  return upsertForTrainer(trainerId, clientId, payload);
}

module.exports = {
  getByClientId,
  getForRequester,
  upsertForTrainer,
  syncFromDietPlanTotals,
};
