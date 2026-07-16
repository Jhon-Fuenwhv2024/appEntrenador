const db = require('../../config/db');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Lista todos los trainers con plan SaaS y client_count
 * (alumnos registrados + invitaciones pending).
 */
async function listAllTrainers() {
  const [rows] = await db.query(
    `SELECT
       u.id,
       u.username,
       u.nombre,
       COALESCE(ti.saas_plan, 'FREE') AS saas_plan,
       ti.saas_expiration_date,
       (
         SELECT COUNT(*)
         FROM usuarios c
         WHERE c.trainer_id = u.id AND c.rol = 'client'
       ) + (
         SELECT COUNT(*)
         FROM invitaciones i
         WHERE i.trainer_id = u.id AND i.status = 'pending'
       ) AS client_count
     FROM usuarios u
     LEFT JOIN trainers_info ti ON ti.user_id = u.id
     WHERE u.rol = 'trainer'
     ORDER BY u.nombre ASC`,
  );

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    nombre: row.nombre,
    saas_plan: row.saas_plan || 'FREE',
    saas_expiration_date: row.saas_expiration_date || null,
    client_count: Number(row.client_count) || 0,
  }));
}

/**
 * UPSERT del plan SaaS de un trainer en trainers_info.
 */
async function updateTrainerPlan(trainerId, plan, expirationDate) {
  const id = Number(trainerId);
  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError('ID de entrenador inválido.', 400);
  }

  const [trainerRows] = await db.query(
    `SELECT id FROM usuarios WHERE id = ? AND rol = 'trainer' LIMIT 1`,
    [id],
  );

  if (trainerRows.length === 0) {
    throw createHttpError('Entrenador no encontrado.', 404);
  }

  await db.query(
    `INSERT INTO trainers_info (user_id, saas_plan, saas_expiration_date)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       saas_plan = VALUES(saas_plan),
       saas_expiration_date = VALUES(saas_expiration_date)`,
    [id, plan, expirationDate],
  );

  const [rows] = await db.query(
    `SELECT user_id, saas_plan, saas_expiration_date
     FROM trainers_info
     WHERE user_id = ?
     LIMIT 1`,
    [id],
  );

  return {
    trainer_id: id,
    saas_plan: rows[0]?.saas_plan || plan,
    saas_expiration_date: rows[0]?.saas_expiration_date || null,
  };
}

module.exports = {
  listAllTrainers,
  updateTrainerPlan,
};
