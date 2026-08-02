const gymMembershipService = require('./gym-membership.service');

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
    const data = await gymMembershipService.getForClient(req.user.id);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo membresía del gym:');
  }
}

async function upsertMine(req, res) {
  try {
    const data = await gymMembershipService.upsertForClient(req.user.id, req.body);

    return res.json({
      success: true,
      message: 'Membresía del gym guardada',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error guardando membresía del gym:');
  }
}

async function deleteMine(req, res) {
  try {
    await gymMembershipService.deleteForClient(req.user.id);

    return res.json({
      success: true,
      message: 'Membresía del gym eliminada',
      data: null,
    });
  } catch (error) {
    return sendError(res, error, 'Error eliminando membresía del gym:');
  }
}

module.exports = {
  getMine,
  upsertMine,
  deleteMine,
};
