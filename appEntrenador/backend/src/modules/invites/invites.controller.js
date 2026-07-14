const invitesService = require('./invites.service');

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

async function create(req, res) {
  try {
    const invitation = await invitesService.createInvite(req.user.id);

    return res.status(201).json({
      success: true,
      message: 'Token generado con éxito',
      data: invitation,
      token: invitation.token,
      link_invitacion: invitation.link_invitacion,
    });
  } catch (error) {
    return sendError(res, error, 'Error generando invitación:');
  }
}

async function list(req, res) {
  try {
    const invites = await invitesService.listInvites(req.user.id);

    return res.json({
      success: true,
      data: invites,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando invitaciones:');
  }
}

async function revoke(req, res) {
  try {
    const result = await invitesService.revokeInvite(req.params.id, req.user.id);

    return res.json({
      success: true,
      message: 'Invitación revocada',
      data: result,
    });
  } catch (error) {
    return sendError(res, error, 'Error revocando invitación:');
  }
}

module.exports = {
  create,
  list,
  revoke,
};
