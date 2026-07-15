const habitsService = require('./habits.service');

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

/**
 * GET /api/habits/client/:clientId
 */
async function listByClient(req, res) {
  try {
    const data = await habitsService.listByClientForTrainer(
      req.user.id,
      req.params.clientId,
    );
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando hábitos del cliente:');
  }
}

/**
 * POST /api/habits/client/:clientId
 * Body: { title }
 */
async function createForClient(req, res) {
  try {
    const data = await habitsService.createForTrainer(
      req.user.id,
      req.params.clientId,
      req.body,
    );
    return res.status(201).json({
      success: true,
      message: 'Hábito creado',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error creando hábito:');
  }
}

/**
 * DELETE /api/habits/:id
 */
async function remove(req, res) {
  try {
    const data = await habitsService.deleteForTrainer(req.user.id, req.params.id);
    return res.json({
      success: true,
      message: 'Hábito eliminado',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error eliminando hábito:');
  }
}

/**
 * GET /api/habits/today?date=YYYY-MM-DD
 */
async function listToday(req, res) {
  try {
    const data = await habitsService.listTodayForClient(
      req.user.id,
      req.query.date,
    );
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo hábitos de hoy:');
  }
}

/**
 * POST /api/habits/:id/toggle
 * Body: { date: "YYYY-MM-DD" }
 */
async function toggle(req, res) {
  try {
    const data = await habitsService.toggleForClient(
      req.user.id,
      req.params.id,
      req.body?.date,
    );
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error al marcar/desmarcar hábito:');
  }
}

module.exports = {
  listByClient,
  createForClient,
  remove,
  listToday,
  toggle,
};
