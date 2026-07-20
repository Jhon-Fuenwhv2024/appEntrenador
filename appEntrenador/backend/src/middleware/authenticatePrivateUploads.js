const path = require('path');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * Auth for private static media (/uploads/photos, /uploads/avatars).
 * <img>/<video> cannot send Authorization — accept Bearer or ?token= (same as SSE).
 * Exercises media stays public under /uploads/exercises.
 */
function authenticatePrivateUploads(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, headerToken] = header.split(' ');
  const queryToken = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  const token = (scheme === 'Bearer' && headerToken) ? headerToken : queryToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No autenticado. Token requerido.',
      message: 'No autenticado. Token requerido.',
      code: 401,
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload?.id || !payload?.rol) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido.',
        message: 'Token inválido.',
        code: 401,
      });
    }
    if (!['trainer', 'client'].includes(payload.rol)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para esta acción.',
        message: 'No tienes permiso para esta acción.',
        code: 403,
      });
    }
    req.user = {
      id: Number(payload.id),
      username: payload.username,
      nombre: payload.nombre,
      rol: payload.rol,
    };
    return next();
  } catch (error) {
    console.error('Error verificando JWT (uploads privados):', error.message);
    return res.status(401).json({
      success: false,
      error: 'Token inválido o expirado.',
      message: 'Token inválido o expirado.',
      code: 401,
    });
  }
}

const UPLOADS_ROOT = path.join(__dirname, '../../public/uploads');

function mountPrivateUploads(app, express) {
  app.use(
    '/uploads/photos',
    authenticatePrivateUploads,
    express.static(path.join(UPLOADS_ROOT, 'photos')),
  );
  app.use(
    '/uploads/avatars',
    authenticatePrivateUploads,
    express.static(path.join(UPLOADS_ROOT, 'avatars')),
  );
  // Catálogo de ejercicios: público (menos sensible; usado en listados/media).
  app.use(
    '/uploads/exercises',
    express.static(path.join(UPLOADS_ROOT, 'exercises')),
  );
}

module.exports = {
  authenticatePrivateUploads,
  mountPrivateUploads,
};
