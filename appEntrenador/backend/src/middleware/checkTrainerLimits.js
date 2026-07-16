const db = require('../config/db');

/**
 * Gatekeeper plan FREE: bloquea creación de invitaciones si el trainer
 * ya tiene >= 3 slots ocupados (alumnos registrados + invites pending).
 * Usar después de authenticate + requireRole('trainer').
 */
async function checkTrainerLimits(req, res, next) {
  try {
    const trainerId = req.user?.id;
    if (!trainerId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'No autenticado.',
      });
    }

    const [planRows] = await db.query(
      `SELECT saas_plan
       FROM trainers_info
       WHERE user_id = ?
       LIMIT 1`,
      [trainerId],
    );

    const plan = planRows[0]?.saas_plan || 'FREE';

    if (plan === 'PRO') {
      return next();
    }

    const [[clientRow]] = await db.query(
      `SELECT COUNT(*) AS count
       FROM usuarios
       WHERE trainer_id = ? AND rol = 'client'`,
      [trainerId],
    );

    const [[inviteRow]] = await db.query(
      `SELECT COUNT(*) AS count
       FROM invitaciones
       WHERE trainer_id = ? AND status = 'pending'`,
      [trainerId],
    );

    const total = Number(clientRow?.count || 0) + Number(inviteRow?.count || 0);

    if (total >= 3) {
      return res.status(402).json({
        success: false,
        error: 'LIMIT_EXCEEDED',
        message: 'Límite de clientes alcanzado en plan gratuito. Actualiza a PRO.',
      });
    }

    return next();
  } catch (error) {
    console.error('Error en checkTrainerLimits:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Error al verificar límites del plan.',
    });
  }
}

module.exports = checkTrainerLimits;
