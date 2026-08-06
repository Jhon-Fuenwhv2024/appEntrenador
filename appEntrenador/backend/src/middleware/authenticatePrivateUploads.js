const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, isR2Configured } = require('../config/env');
const { getAvatarFromR2 } = require('../shared/storage/avatarStorage');
const { AVATARS_DIR } = require('../shared/storage/avatarPaths');
const { getExerciseGifFromR2 } = require('../shared/storage/exerciseMediaStorage');
const {
  EXERCISES_DIR,
  isValidExerciseGifFilename,
} = require('../shared/storage/exerciseMediaPaths');

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
    // Log de diagnóstico al fallar jwt.verify en /uploads (photos|avatars).
    // Comentado: ruido frecuente con access expirado. Descomentar si hay que depurar media auth.
    // console.error('Error verificando JWT (uploads privados):', error.message);
    return res.status(401).json({
      success: false,
      error: 'Token inválido o expirado.',
      message: 'Token inválido o expirado.',
      code: 401,
    });
  }
}

const UPLOADS_ROOT = path.join(__dirname, '../../public/uploads');

/**
 * Stream avatar from R2 when configured; otherwise 404 JSON.
 */
async function serveAvatarFromR2(req, res) {
  const filename = path.basename(req.path || '');
  if (!filename || filename === '/' || filename === '.') {
    return res.status(404).json({
      success: false,
      error: 'Avatar no encontrado.',
      message: 'Avatar no encontrado.',
      code: 404,
    });
  }

  try {
    const object = await getAvatarFromR2(filename);
    if (!object) {
      return res.status(404).json({
        success: false,
        error: 'Avatar no encontrado.',
        message: 'Avatar no encontrado.',
        code: 404,
      });
    }

    if (object.contentType) {
      res.setHeader('Content-Type', object.contentType);
    }
    if (object.contentLength != null) {
      res.setHeader('Content-Length', String(object.contentLength));
    }
    res.setHeader('Cache-Control', 'private, max-age=300');

    if (typeof object.body?.pipe === 'function') {
      object.body.pipe(res);
      return undefined;
    }

    const chunks = [];
    for await (const chunk of object.body) {
      chunks.push(chunk);
    }
    return res.send(Buffer.concat(chunks));
  } catch (error) {
    console.error('[avatars/r2] serve failed:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Error al servir el avatar.',
      message: 'Error al servir el avatar.',
      code: 500,
    });
  }
}

/**
 * Serve catalog exercise GIF from R2; on miss, fall back to local disk.
 * Public (no JWT).
 */
async function serveExerciseGif(req, res, next) {
  const filename = path.basename(req.path || '');
  if (!isValidExerciseGifFilename(filename)) {
    return res.status(404).json({
      success: false,
      error: 'Media de ejercicio no encontrada.',
      message: 'Media de ejercicio no encontrada.',
      code: 404,
    });
  }

  try {
    if (isR2Configured) {
      const object = await getExerciseGifFromR2(filename);
      if (object) {
        res.setHeader('Content-Type', object.contentType || 'image/gif');
        if (object.contentLength != null) {
          res.setHeader('Content-Length', String(object.contentLength));
        }
        res.setHeader('Cache-Control', 'public, max-age=86400');

        if (typeof object.body?.pipe === 'function') {
          object.body.pipe(res);
          return undefined;
        }

        const chunks = [];
        for await (const chunk of object.body) {
          chunks.push(chunk);
        }
        return res.send(Buffer.concat(chunks));
      }
    }

    const localFile = path.join(EXERCISES_DIR, filename);
    try {
      await fs.promises.access(localFile, fs.constants.R_OK);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Media de ejercicio no encontrada.',
        message: 'Media de ejercicio no encontrada.',
        code: 404,
      });
    }

    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(localFile);
  } catch (error) {
    console.error('[exercises/media] serve failed:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Error al servir la media del ejercicio.',
      message: 'Error al servir la media del ejercicio.',
      code: 500,
    });
  }
}

function mountPrivateUploads(app, express) {
  app.use(
    '/uploads/photos',
    authenticatePrivateUploads,
    express.static(path.join(UPLOADS_ROOT, 'photos')),
  );

  if (isR2Configured) {
    app.use('/uploads/avatars', authenticatePrivateUploads, (req, res) => {
      serveAvatarFromR2(req, res);
    });
  } else {
    app.use(
      '/uploads/avatars',
      authenticatePrivateUploads,
      express.static(AVATARS_DIR),
    );
  }

  // Catálogo de ejercicios: público. R2 cuando está configurado; fallback disco.
  if (isR2Configured) {
    app.use('/uploads/exercises', (req, res, next) => {
      serveExerciseGif(req, res, next);
    });
  } else {
    app.use(
      '/uploads/exercises',
      express.static(path.join(UPLOADS_ROOT, 'exercises')),
    );
  }
}

module.exports = {
  authenticatePrivateUploads,
  mountPrivateUploads,
  serveExerciseGif,
};
