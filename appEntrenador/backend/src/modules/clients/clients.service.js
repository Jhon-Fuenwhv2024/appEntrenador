const db = require('../../config/db');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function getClientsForTrainer(trainerId) {
  const [clients] = await db.query(
    `SELECT id, nombre, username
     FROM usuarios
     WHERE rol = 'client' AND trainer_id = ?
     ORDER BY nombre ASC`,
    [trainerId],
  );

  return clients;
}

async function getClientOwnedByTrainer(clientId, trainerId) {
  const [rows] = await db.query(
    `SELECT id, nombre, username, trainer_id
     FROM usuarios
     WHERE id = ? AND rol = 'client' AND trainer_id = ?`,
    [clientId, trainerId],
  );

  if (rows.length === 0) {
    throw createHttpError('Cliente no encontrado o no pertenece a tu cuenta.', 404);
  }

  return rows[0];
}

module.exports = {
  getClientsForTrainer,
  getClientOwnedByTrainer,
  createHttpError,
};
