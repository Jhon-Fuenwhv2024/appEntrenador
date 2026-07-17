const clientsService = require('./clients.service');

function sendError(res, error, context) {
  const code = error.code || 500;
  const message = error.message || 'Error interno del servidor';

  console.error(context, error);

  return res.status(code).json({
    success: false,
    error: message,
    message,
    code,
  });
}

async function getClients(req, res) {
  try {
    const clients = await clientsService.getClientsForTrainer(req.user.id);

    return res.json({
      success: true,
      clients,
    });
  } catch (error) {
    return sendError(res, error, 'Error al consultar clientes:');
  }
}

async function getClientById(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const client = await clientsService.getClientOwnedByTrainer(clientId, req.user.id);

    return res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    return sendError(res, error, 'Error al consultar cliente:');
  }
}

async function getClientOverview(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const data = await clientsService.getClientOverview(clientId, req.user.id);

    return res.json({
      success: true,
      data,
      message: 'Overview del alumno',
    });
  } catch (error) {
    return sendError(res, error, 'Error al consultar overview del cliente:');
  }
}

async function getDashboard(req, res) {
  try {
    const data = await clientsService.getDashboardStats(req.user.id);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error al consultar dashboard del trainer:');
  }
}

module.exports = {
  getClients,
  getClientById,
  getClientOverview,
  getDashboard,
};
