const authService = require('./auth.service');

function resolveHttpStatus(error) {
  const raw = error?.statusCode ?? error?.code;
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 400 && n < 600) return n;
  return 500;
}

function sendError(res, error, context) {
  const code = resolveHttpStatus(error);
  const message = error.message || 'Error interno del servidor.';

  console.error(context, {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    sqlState: error.sqlState,
    errno: error.errno,
  });

  return res.status(code).json({
    success: false,
    error: message,
    message,
    code,
  });
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body);

    if (!result?.token || !result?.user) {
      const error = new Error(
        'No se pudo emitir el token de sesión. Reinicia el backend con el código actualizado.',
      );
      error.code = 500;
      throw error;
    }

    return res.json({
      success: true,
      message: '¡Login correcto!',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return sendError(res, error, 'Error en login:');
  }
}

async function register(req, res) {
  try {
    await authService.register(req.body);

    return res.json({
      success: true,
      message: '¡Cuenta de alumno creada exitosamente!',
    });
  } catch (error) {
    return sendError(res, error, 'Error en registro:');
  }
}

async function forgotPassword(req, res) {
  try {
    const result = await authService.forgotPassword(req.body || {});

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return sendError(res, error, 'Error en forgot-password:');
  }
}

async function resetPassword(req, res) {
  try {
    await authService.resetPassword(req.body || {});

    return res.json({
      success: true,
      message: 'Contraseña actualizada. Ya puedes iniciar sesión.',
    });
  } catch (error) {
    return sendError(res, error, 'Error en reset-password:');
  }
}

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
};
