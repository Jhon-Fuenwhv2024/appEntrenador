const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { isR2Configured } = require('../config/env');
const { buildAvatarFilename, AVATARS_DIR } = require('../shared/storage/avatarPaths');

function ensureAvatarsDir() {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function resolveUploadUserId(req) {
  return Number(req.params.userId) || Number(req.user?.id) || 'unknown';
}

const diskStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    try {
      ensureAvatarsDir();
      cb(null, AVATARS_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename(req, file, cb) {
    const userId = resolveUploadUserId(req);
    cb(null, buildAvatarFilename(userId, file.originalname, file.mimetype));
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    const error = new Error('Solo se permiten imágenes (JPEG, PNG, WebP o GIF).');
    error.code = 400;
    return cb(error);
  }
  return cb(null, true);
}

const uploadAvatar = multer({
  storage: isR2Configured ? multer.memoryStorage() : diskStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
}).single('foto');

/**
 * Multer wrapper that maps errors to HTTP-friendly shape.
 * With R2 (memory storage), assigns `file.filename` for downstream services.
 */
function uploadAvatarMiddleware(req, res, next) {
  uploadAvatar(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'La imagen supera el límite de 2 MB.',
            message: 'La imagen supera el límite de 2 MB.',
            code: 400,
          });
        }
        return res.status(400).json({
          success: false,
          error: error.message,
          message: error.message,
          code: 400,
        });
      }

      const code = error.code || 400;
      return res.status(code).json({
        success: false,
        error: error.message || 'Error al subir la imagen.',
        message: error.message || 'Error al subir la imagen.',
        code,
      });
    }

    if (req.file && !req.file.filename) {
      const userId = resolveUploadUserId(req);
      req.file.filename = buildAvatarFilename(
        userId,
        req.file.originalname,
        req.file.mimetype,
      );
    }

    return next();
  });
}

module.exports = {
  uploadAvatarMiddleware,
  AVATARS_DIR,
  ensureAvatarsDir,
};
