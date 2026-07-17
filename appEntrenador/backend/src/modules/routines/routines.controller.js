const routinesService = require('./routines.service');
const membershipsService = require('../memberships/memberships.service');
const { notificationService } = require('../notifications/notifications.service');

function sendError(res, error, context) {
  const httpStatus = Number(error.code) || 500;
  const message = error.message || 'Error interno del servidor.';
  const errorKey = error.error || message;

  console.error(context, error);

  return res.status(httpStatus).json({
    success: false,
    error: errorKey,
    message,
    code: error.error || httpStatus,
  });
}

async function listForClient(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const routines = await routinesService.listRoutinesForClientAsTrainer(
      req.user.id,
      clientId,
    );

    return res.json({
      success: true,
      data: routines,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando rutinas:');
  }
}

async function listMine(req, res) {
  try {
    await membershipsService.assertClientMembershipAccess(req.user.id);
    const routines = await routinesService.listMyRoutines(req.user.id);

    return res.json({
      success: true,
      data: routines,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando mis rutinas:');
  }
}

/**
 * Feature 038 — dashboard immersivo del cliente (una sola petición).
 * Query: date=YYYY-MM-DD (fecha civil local del dispositivo).
 */
async function getToday(req, res) {
  try {
    const bundle = await routinesService.getTodayBundle(
      req.user.id,
      req.query.date,
    );

    return res.json({
      success: true,
      data: {
        todayRoutine: bundle.todayRoutine,
        todayCompleted: Boolean(bundle.todayCompleted),
        habits: bundle.habits,
        macros: bundle.macros,
        date: bundle.date,
        weekday: bundle.weekday,
        membership: bundle.membership ?? null,
        membershipBlocked: Boolean(bundle.membershipBlocked),
      },
    });
  } catch (error) {
    return sendError(res, error, 'Error cargando resumen de hoy:');
  }
}

async function create(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const routine = await routinesService.createRoutine(
      req.user.id,
      clientId,
      req.body,
    );

    // Notificar al cliente
    try {
      await notificationService.createNotification(
        clientId,
        'Nueva rutina asignada',
        `Tu entrenador ha creado la rutina: ${routine.nombre_rutina}`,
        'routine_assigned'
      );
    } catch (notifError) {
      console.error('Error enviando notificación (create routine):', notifError);
    }

    return res.status(201).json({
      success: true,
      message: 'Rutina creada',
      data: routine,
    });
  } catch (error) {
    return sendError(res, error, 'Error creando rutina:');
  }
}

async function update(req, res) {
  try {
    const routineId = Number(req.params.routineId);
    const routine = await routinesService.updateRoutine(
      req.user.id,
      routineId,
      req.body,
    );

    // Notificar al cliente
    try {
      await notificationService.createNotification(
        routine.alumno_id,
        'Rutina actualizada',
        `Tu entrenador ha actualizado la rutina: ${routine.nombre_rutina}`,
        'routine_assigned'
      );
    } catch (notifError) {
      console.error('Error enviando notificación (update routine):', notifError);
    }

    return res.json({
      success: true,
      message: 'Rutina actualizada',
      data: routine,
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando rutina:');
  }
}

async function remove(req, res) {
  try {
    const routineId = Number(req.params.routineId);
    await routinesService.deleteRoutine(req.user.id, routineId);

    return res.json({
      success: true,
      message: 'Rutina eliminada',
    });
  } catch (error) {
    return sendError(res, error, 'Error eliminando rutina:');
  }
}

module.exports = {
  listForClient,
  listMine,
  getToday,
  create,
  update,
  remove,
};
