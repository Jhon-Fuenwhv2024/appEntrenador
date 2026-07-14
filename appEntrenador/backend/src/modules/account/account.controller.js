const accountService = require('./account.service');

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

async function getMine(req, res) {
  try {
    const account = await accountService.getMyAccount(req.user.id);
    return res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo cuenta:');
  }
}

async function updateMine(req, res) {
  try {
    const result = await accountService.updateMyAccount(
      req.user.id,
      req.body || {},
      req.file || null,
    );

    return res.json({
      success: true,
      message: 'Cuenta actualizada',
      data: result.account,
      token: result.token,
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando cuenta:');
  }
}

async function changePassword(req, res) {
  try {
    await accountService.changeMyPassword(req.user.id, req.body || {});
    return res.json({
      success: true,
      message: 'Contraseña actualizada',
      data: { changed: true },
    });
  } catch (error) {
    return sendError(res, error, 'Error cambiando contraseña:');
  }
}

module.exports = {
  getMine,
  updateMine,
  changePassword,
};
