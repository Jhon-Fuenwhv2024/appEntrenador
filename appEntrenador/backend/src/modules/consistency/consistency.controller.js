const consistencyService = require('./consistency.service');

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

async function getMine(req, res) {
  try {
    const data = await consistencyService.getMine(req.user.id);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo mi consistencia:');
  }
}

async function getForClient(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const data = await consistencyService.getForTrainer(req.user.id, clientId);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo consistencia del cliente:');
  }
}

async function updateWeekGoal(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const weekGoal = req.body?.week_goal ?? req.body?.weekGoal;
    const data = await consistencyService.updateWeekGoalForTrainer(
      req.user.id,
      clientId,
      weekGoal,
    );
    return res.json({
      success: true,
      message: 'Meta semanal actualizada',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando meta semanal:');
  }
}

module.exports = {
  getMine,
  getForClient,
  updateWeekGoal,
};
