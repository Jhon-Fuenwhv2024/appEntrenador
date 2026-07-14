const fs = require('fs');
const path = require('path');
const multer = require('multer');

const AVATARS_DIR = path.join(__dirname, '../../public/uploads/avatars');

function ensureAvatarsDir() {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    try {
      ensureAvatarsDir();
      cb(null, AVATARS_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename(req, file, cb) {
    const userId = Number(req.params.userId) || Number(req.user?.id) || 'unknown';
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
      ? (ext === '.jpeg' ? '.jpg' : ext)
      : '.jpg';
    cb(null, `user_${userId}${safeExt}`);
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
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
}).single('foto');

/**
 * Multer wrapper that maps errors to HTTP-friendly shape.
 */
function uploadAvatarMiddleware(req, res, next) {
  uploadAvatar(req, res, (error) => {
    if (!error) return next();

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
  });
}

module.exports = {
  uploadAvatarMiddleware,
  AVATARS_DIR,
  ensureAvatarsDir,
};
