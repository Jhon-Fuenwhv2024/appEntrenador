const fs = require('fs');
const multer = require('multer');
const { isR2Configured } = require('../config/env');
const {
  EXERCISES_DIR,
  buildTrainerMediaFilename,
  MIME_TO_EXT,
} = require('../shared/storage/exerciseMediaPaths');

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set(Object.keys(MIME_TO_EXT));

function ensureExercisesDir() {
  fs.mkdirSync(EXERCISES_DIR, { recursive: true });
}

function resolveTrainerId(req) {
  return Number(req.user?.id) || 0;
}

const diskStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    try {
      ensureExercisesDir();
      cb(null, EXERCISES_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename(req, file, cb) {
    try {
      const trainerId = resolveTrainerId(req);
      cb(null, buildTrainerMediaFilename(trainerId, file.mimetype));
    } catch (error) {
      cb(error);
    }
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    const error = new Error(
      'Solo se permiten imágenes (JPEG, PNG, WebP, GIF) o videos (MP4, WebM).',
    );
    error.code = 400;
    return cb(error);
  }
  return cb(null, true);
}

const uploadExerciseMedia = multer({
  storage: isR2Configured ? multer.memoryStorage() : diskStorage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
}).single('media_file');

/**
 * Optional multipart for create/update exercise.
 * Skip Multer on JSON bodies — Multer resets `req.body` to `{}` and would
 * drop fields already parsed by express.json() (e.g. empty `name`).
 * Maps Multer errors to the project JSON error shape.
 */
function uploadExerciseMediaMiddleware(req, res, next) {
  const contentType = String(req.headers['content-type'] || '');
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return next();
  }

  uploadExerciseMedia(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'El archivo supera el límite de 10 MB.',
            message: 'El archivo supera el límite de 10 MB.',
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
        error: error.message || 'Error al subir el archivo multimedia.',
        message: error.message || 'Error al subir el archivo multimedia.',
        code,
      });
    }

    if (req.file && !req.file.filename) {
      try {
        req.file.filename = buildTrainerMediaFilename(
          resolveTrainerId(req),
          req.file.mimetype,
        );
      } catch (assignError) {
        return res.status(400).json({
          success: false,
          error: assignError.message || 'Tipo de archivo no permitido.',
          message: assignError.message || 'Tipo de archivo no permitido.',
          code: 400,
        });
      }
    }

    return next();
  });
}

module.exports = {
  uploadExerciseMediaMiddleware,
  MAX_FILE_SIZE_BYTES,
  EXERCISES_DIR,
  ensureExercisesDir,
};
