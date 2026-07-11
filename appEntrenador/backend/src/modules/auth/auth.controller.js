const authService = require('./auth.service');

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

async function login(req, res) {
  try {
    const user = await authService.login(req.body);

    return res.json({
      success: true,
      message: '¡Login correcto!',
      user,
    });
  } catch (error) {
    return sendError(res, error, 'Error en login:');
  }
}

async function generateInvitation(req, res) {
  try {
    const invitation = await authService.generateInvitation();

    return res.json({
      success: true,
      message: 'Token generado con éxito',
      ...invitation,
    });
  } catch (error) {
    return sendError(res, error, 'Error generando token:');
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

module.exports = {
  login,
  generateInvitation,
  register,
};
