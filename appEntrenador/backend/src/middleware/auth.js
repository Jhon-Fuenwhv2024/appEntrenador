const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function sendAuthError(res, message, code) {
  return res.status(code).json({
    success: false,
    error: message,
    message,
    code,
  });
}

/**
 * Verifica Bearer JWT y pobla req.user = { id, username, nombre, rol }.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return sendAuthError(res, 'No autenticado. Token requerido.', 401);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (!payload?.id || !payload?.rol) {
      return sendAuthError(res, 'Token inválido.', 401);
    }

    req.user = {
      id: Number(payload.id),
      username: payload.username,
      nombre: payload.nombre,
      rol: payload.rol,
    };

    return next();
  } catch (error) {
    console.error('Error verificando JWT:', error.message);
    return sendAuthError(res, 'Token inválido o expirado.', 401);
  }
}

/**
 * Exige que req.user.rol esté en la lista de roles permitidos.
 * Usar después de authenticate.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendAuthError(res, 'No autenticado.', 401);
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return sendAuthError(res, 'No tienes permiso para esta acción.', 403);
    }

    return next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  createHttpError,
};
