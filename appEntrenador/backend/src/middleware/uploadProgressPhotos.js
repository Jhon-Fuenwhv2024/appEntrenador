const fs = require('fs');
const path = require('path');
const multer = require('multer');

const PHOTOS_DIR = path.join(__dirname, '../../public/uploads/photos');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png']);
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png']);

function ensurePhotosDir() {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

function cleanupProgressPhotoFiles(filesByField) {
  if (!filesByField || typeof filesByField !== 'object') return;

  for (const files of Object.values(filesByField)) {
    if (!Array.isArray(files)) continue;
    for (const file of files) {
      if (!file?.path) continue;
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error('No se pudo limpiar una foto de progreso:', error.message);
        }
      }
    }
  }
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    try {
      ensurePhotosDir();
      cb(null, PHOTOS_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename(req, file, cb) {
    const userId = Number(req.user?.id) || 'unknown';
    const pose = String(file.fieldname || 'photo').replace(/[^a-z]/gi, '') || 'photo';
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ALLOWED_EXT.has(ext)
      ? (ext === '.jpeg' ? '.jpg' : ext)
      : '.jpg';
    const stamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    cb(null, `client_${userId}_${pose}_${stamp}_${rand}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(file.mimetype)) {
    const error = new Error('Solo se permiten imágenes JPG o PNG.');
    error.code = 400;
    return cb(error);
  }
  return cb(null, true);
}

const uploadProgressPhotos = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 3,
  },
}).fields([
  { name: 'front', maxCount: 1 },
  { name: 'side', maxCount: 1 },
  { name: 'back', maxCount: 1 },
]);

/**
 * Multer wrapper: maps errors to project JSON shape.
 * Photos are optional — missing files is OK.
 */
function uploadProgressPhotosMiddleware(req, res, next) {
  uploadProgressPhotos(req, res, (error) => {
    if (!error) return next();

    cleanupProgressPhotoFiles(req.files);

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'Cada foto no puede superar 5 MB.',
          message: 'Cada foto no puede superar 5 MB.',
          code: 400,
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: 'Solo se permiten hasta 3 fotos (frente, perfil, espalda).',
          message: 'Solo se permiten hasta 3 fotos (frente, perfil, espalda).',
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
      error: error.message || 'Error al subir las fotos.',
      message: error.message || 'Error al subir las fotos.',
      code,
    });
  });
}

function resolvePhotoPublicUrl(filename) {
  return `/uploads/photos/${filename}`;
}

module.exports = {
  uploadProgressPhotosMiddleware,
  cleanupProgressPhotoFiles,
  ensurePhotosDir,
  PHOTOS_DIR,
  MAX_FILE_SIZE,
  resolvePhotoPublicUrl,
};
