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
 * Verifica Bearer JWT y pobla req.user = { id, username, nombre, rol, is_superadmin }.
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
      is_superadmin: payload.is_superadmin === true,
    };

    return next();
  } catch (error) {
    // Log de diagnóstico al fallar jwt.verify (p. ej. "jwt expired" con access corto).
    // Comentado: ensucia la consola; el 401 sigue igual. Descomentar si hay que depurar auth.
    // console.error('Error verificando JWT:', error.message);
    return sendAuthError(res, 'Token inválido o expirado.', 401);
  }
}

/**
 * Like authenticate, but continues without req.user if missing/invalid.
 * Used for logout when access JWT may already be expired (refresh still present).
 */
function optionalAuthenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload?.id && payload?.rol) {
      req.user = {
        id: Number(payload.id),
        username: payload.username,
        nombre: payload.nombre,
        rol: payload.rol,
        is_superadmin: payload.is_superadmin === true,
      };
    }
  } catch {
    // Ignore expired/invalid access; logout can still revoke via refreshToken body.
  }

  return next();
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
  optionalAuthenticate,
  requireRole,
  createHttpError,
};
