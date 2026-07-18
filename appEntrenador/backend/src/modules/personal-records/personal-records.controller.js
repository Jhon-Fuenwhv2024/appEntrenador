const personalRecordsService = require('./personal-records.service');

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

async function listMine(req, res) {
  try {
    const data = await personalRecordsService.listMine(req.user.id);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, 'Error listando mis récords personales:');
  }
}

async function listForClient(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const data = await personalRecordsService.listForClientAsTrainer(req.user.id, clientId);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, 'Error listando récords del cliente:');
  }
}

module.exports = {
  listMine,
  listForClient,
};
