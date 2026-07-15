const workoutSessionsService = require('./workout-sessions.service');
const { notificationService } = require('../notifications/notifications.service');
const db = require('../../config/db');

function sendError(res, error, context) {
  const code = error.code || 500;
  const message = error.message || 'Error interno del servidor.';

  console.error(context, error);

  return res.status(code).json({
    success: false,
    error: message,
    message,
    code,
  });
}

async function createMine(req, res) {
  try {
    const session = await workoutSessionsService.createMySession(req.user.id, req.body);

    try {
      const [rows] = await db.query(
        'SELECT trainer_id FROM usuarios WHERE id = ? AND rol = ? LIMIT 1',
        [req.user.id, 'client'],
      );
      const trainerId = rows[0]?.trainer_id;

      if (trainerId && session.status === 'completed') {
        const clientName = req.user.nombre || 'Tu alumno';
        await notificationService.createNotification(
          trainerId,
          'Entrenamiento completado',
          `${clientName} ha completado la rutina: ${session.routine_name}`,
          'routine_completed',
        );
      }
    } catch (notifError) {
      console.error('Error enviando notificación (create session):', notifError);
    }

    return res.status(201).json({
      success: true,
      message: 'Entrenamiento guardado',
      data: session,
    });
  } catch (error) {
    return sendError(res, error, 'Error guardando sesión de entrenamiento:');
  }
}

async function listMine(req, res) {
  try {
    const sessions = await workoutSessionsService.listMySessions(req.user.id);
    return res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando tu historial de entrenamientos:');
  }
}

async function listForClient(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const sessions = await workoutSessionsService.listSessionsForClientAsTrainer(
      req.user.id,
      clientId,
    );
    return res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando historial de entrenamientos:');
  }
}

module.exports = {
  createMine,
  listMine,
  listForClient,
};
