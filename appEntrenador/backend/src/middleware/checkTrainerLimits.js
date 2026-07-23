const db = require('../config/db');
const { resolveEffectiveSaasPlan } = require('../shared/saas/effectivePlan');

/**
 * Gatekeeper plan FREE (efectivo): bloquea creación de invitaciones si el trainer
 * ya tiene >= 3 slots ocupados (alumnos registrados + invites pending).
 * PRO con saas_expiration_date < hoy se trata como FREE (Feature 065).
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
      `SELECT saas_plan, saas_expiration_date
       FROM trainers_info
       WHERE user_id = ?
       LIMIT 1`,
      [trainerId],
    );

    const resolved = resolveEffectiveSaasPlan(
      planRows[0]?.saas_plan,
      planRows[0]?.saas_expiration_date,
    );

    if (resolved.effective_plan === 'PRO') {
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
      const message = resolved.is_expired
        ? 'Tu plan PRO venció. Renueva para seguir invitando alumnos sin límite.'
        : 'Límite de clientes alcanzado en plan gratuito. Actualiza a PRO.';

      return res.status(402).json({
        success: false,
        error: 'LIMIT_EXCEEDED',
        message,
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
