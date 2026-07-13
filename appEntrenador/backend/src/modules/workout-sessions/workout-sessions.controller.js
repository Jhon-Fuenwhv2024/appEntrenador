const workoutSessionsService = require('./workout-sessions.service');

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
    return res.status(201).json({
      success: true,
      message: 'Entrenamiento guardado',
      data: session,
    });
  } catch (error) {
    return sendError(res, error, 'Error guardando sesión de entrenamiento:');
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
  listForClient,
};
