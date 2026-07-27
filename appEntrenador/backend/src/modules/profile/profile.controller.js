const profileService = require('./profile.service');

function resolveHttpStatus(error) {
  const code = error?.code;
  if (Number.isInteger(code) && code >= 400 && code < 600) return code;
  if (typeof code === 'string' && /^\d{3}$/.test(code)) {
    const n = Number(code);
    if (n >= 400 && n < 600) return n;
  }
  return 500;
}

function sendError(res, error, context) {
  const status = resolveHttpStatus(error);
  const message = error.message || 'Error interno del servidor.';
  const errorKey = error.error || message;

  console.error(context, {
    message: error.message,
    code: error.code,
    errno: error.errno,
    sqlMessage: error.sqlMessage,
  });

  // Si ya se enviaron headers (p. ej. fallo al setear status inválido), no reventar de nuevo.
  if (res.headersSent) return undefined;

  return res.status(status).json({
    success: false,
    error: errorKey,
    message,
    code: typeof error.error === 'string' ? error.error : status,
    ...(status === 500 && error.sqlMessage
      ? { details: { sqlMessage: error.sqlMessage, mysqlCode: error.code } }
      : {}),
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
