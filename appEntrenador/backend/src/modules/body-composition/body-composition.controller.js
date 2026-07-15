const bodyCompositionService = require('./body-composition.service');

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

async function listMine(req, res) {
  try {
    const logs = await bodyCompositionService.listMine(req.user.id);
    return res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando composición corporal:');
  }
}

async function listForClient(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const logs = await bodyCompositionService.listForClientAsTrainer(
      req.user.id,
      clientId,
    );
    return res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando composición corporal del cliente:');
  }
}

async function createForClient(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const log = await bodyCompositionService.createForClient(
      req.user.id,
      clientId,
      req.body,
    );
    return res.status(201).json({
      success: true,
      message: 'Medición registrada',
      data: log,
    });
  } catch (error) {
    return sendError(res, error, 'Error creando medición de composición corporal:');
  }
}

async function updateForClient(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const logId = Number(req.params.logId);
    const log = await bodyCompositionService.updateForClient(
      req.user.id,
      clientId,
      logId,
      req.body,
    );
    return res.json({
      success: true,
      message: 'Medición actualizada',
      data: log,
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando medición de composición corporal:');
  }
}

module.exports = {
  listMine,
  listForClient,
  createForClient,
  updateForClient,
};
