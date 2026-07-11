const clientsService = require('./clients.service');

async function getClients(req, res) {
  try {
    const clients = await clientsService.getClients();

    return res.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error('Error al consultar clientes:', error);

    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error interno del servidor',
      code: 500,
    });
  }
}

module.exports = {
  getClients,
};
