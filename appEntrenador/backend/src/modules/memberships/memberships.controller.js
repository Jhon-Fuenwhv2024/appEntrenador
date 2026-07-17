const membershipsService = require('./memberships.service');

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

async function getForClientAsTrainer(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const data = await membershipsService.getForTrainer(req.user.id, clientId);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo membresía del cliente:');
  }
}

async function upsertForClientAsTrainer(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const data = await membershipsService.upsertForTrainer(
      req.user.id,
      clientId,
      req.body,
    );

    return res.json({
      success: true,
      message: 'Membresía guardada',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error guardando membresía del cliente:');
  }
}

async function getMine(req, res) {
  try {
    const data = await membershipsService.getForClient(req.user.id);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo mi membresía:');
  }
}

module.exports = {
  getForClientAsTrainer,
  upsertForClientAsTrainer,
  getMine,
};
