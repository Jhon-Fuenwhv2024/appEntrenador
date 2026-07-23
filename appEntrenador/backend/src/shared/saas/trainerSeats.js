/**
 * Soft-lock de asientos FREE (Feature 065 opción B).
 * FREE efectivo: solo los 3 primeros alumnos (id ASC) son editables.
 * Chat / lectura no se bloquean aquí.
 */

const db = require('../../config/db');
const { resolveEffectiveSaasPlan } = require('./effectivePlan');

const FREE_CLIENT_LIMIT = 3;

function createSeatLockedError(isExpired) {
  const error = new Error(
    isExpired
      ? 'Tu plan PRO venció. Solo puedes editar tus 3 primeros alumnos. Renueva para desbloquear el resto.'
      : 'Plan gratuito: solo puedes editar tus 3 primeros alumnos. Actualiza a PRO para gestionar todos.',
  );
  error.code = 402;
  error.error = 'SEAT_LOCKED';
  return error;
}

/**
 * IDs de alumnos incluidos en el cupo FREE (orden estable por id ASC).
 * @param {number} trainerId
 * @returns {Promise<number[]>}
 */
async function getIncludedClientIds(trainerId) {
  const [rows] = await db.query(
    `SELECT id
     FROM usuarios
     WHERE trainer_id = ? AND rol = 'client'
     ORDER BY id ASC
     LIMIT ${FREE_CLIENT_LIMIT}`,
    [trainerId],
  );
  return rows.map((row) => Number(row.id));
}

/**
 * Carga plan SaaS del trainer y resuelve plan efectivo.
 * @param {number} trainerId
 */
async function loadEffectivePlanForTrainer(trainerId) {
  const [planRows] = await db.query(
    `SELECT saas_plan, saas_expiration_date
     FROM trainers_info
     WHERE user_id = ?
     LIMIT 1`,
    [trainerId],
  );
  return resolveEffectiveSaasPlan(
    planRows[0]?.saas_plan,
    planRows[0]?.saas_expiration_date,
  );
}

/**
 * Set de IDs editables + plan efectivo (útil para listados).
 * @param {number} trainerId
 * @returns {Promise<{ resolved: object, includedIds: Set<number>, isPro: boolean }>}
 */
async function getSeatEditabilityContext(trainerId) {
  const resolved = await loadEffectivePlanForTrainer(trainerId);
  if (resolved.effective_plan === 'PRO') {
    return {
      resolved,
      includedIds: null,
      isPro: true,
    };
  }
  const ids = await getIncludedClientIds(trainerId);
  return {
    resolved,
    includedIds: new Set(ids),
    isPro: false,
  };
}

/**
 * @param {number} trainerId
 * @param {number} clientId
 * @returns {Promise<boolean>}
 */
async function isClientSeatEditable(trainerId, clientId) {
  const ctx = await getSeatEditabilityContext(trainerId);
  if (ctx.isPro) return true;
  return ctx.includedIds.has(Number(clientId));
}

/**
 * Bloquea writes de coaching sobre alumnos fuera del cupo FREE.
 * @param {number} trainerId
 * @param {number} clientId
 */
async function assertClientWritableUnderPlan(trainerId, clientId) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error('clientId inválido.');
    error.code = 400;
    throw error;
  }

  const resolved = await loadEffectivePlanForTrainer(trainerId);
  if (resolved.effective_plan === 'PRO') {
    return resolved;
  }

  const included = await getIncludedClientIds(trainerId);
  if (!included.includes(id)) {
    throw createSeatLockedError(resolved.is_expired);
  }

  return resolved;
}

module.exports = {
  FREE_CLIENT_LIMIT,
  getIncludedClientIds,
  loadEffectivePlanForTrainer,
  getSeatEditabilityContext,
  isClientSeatEditable,
  assertClientWritableUnderPlan,
};
