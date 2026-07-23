const nutritionService = require('./nutrition.service');

function sendError(res, error, context) {
  const code = error.code || 500;
  const message = error.message || 'Error interno del servidor.';
  const errorKey = error.error || message;

  console.error(context, error);

  return res.status(code).json({
    success: false,
    error: errorKey,
    message,
    code: error.error || code,
  });
}

async function getByClientId(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const target = await nutritionService.getForRequester(req.user, clientId);
    return res.json({
      success: true,
      data: target,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo objetivos nutricionales:');
  }
}

async function upsertByClientId(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const target = await nutritionService.upsertForTrainer(
      req.user.id,
      clientId,
      req.body,
    );
    return res.json({
      success: true,
      message: 'Objetivos nutricionales guardados',
      data: target,
    });
  } catch (error) {
    return sendError(res, error, 'Error guardando objetivos nutricionales:');
  }
}

module.exports = {
  getByClientId,
  upsertByClientId,
};
