const profileService = require('./profile.service');

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

async function getByUserId(req, res) {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        error: 'userId inválido.',
        message: 'userId inválido.',
        code: 400,
      });
    }

    const profile = await profileService.getProfile(req.user, userId);

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo perfil:');
  }
}

async function upsertByUserId(req, res) {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        error: 'userId inválido.',
        message: 'userId inválido.',
        code: 400,
      });
    }

    const profile = await profileService.upsertProfile(
      req.user,
      userId,
      req.body || {},
      req.file || null,
    );

    return res.json({
      success: true,
      message: 'Perfil guardado',
      data: profile,
    });
  } catch (error) {
    return sendError(res, error, 'Error guardando perfil:');
  }
}

module.exports = {
  getByUserId,
  upsertByUserId,
};
