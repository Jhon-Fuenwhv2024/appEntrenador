const checkinsService = require('./checkins.service');
const {
  cleanupProgressPhotoFiles,
} = require('../../middleware/uploadProgressPhotos');

function sendError(res, error, context) {
  const rawCode = error.code;
  const code = typeof rawCode === 'number' && rawCode >= 400 && rawCode < 600
    ? rawCode
    : 500;
  const message = error.message || 'Error interno del servidor.';

  console.error(context, error);

  return res.status(code).json({
    success: false,
    error: message,
    message,
    code,
  });
}

/**
 * POST /api/checkins
 * multipart/form-data: sleep_quality, stress_level, diet_adherence, notes?, created_at?
 * files opcionales: front, side, back
 */
async function create(req, res) {
  try {
    const data = await checkinsService.createForClient(
      req.user.id,
      req.body,
      req.files,
    );
    return res.status(201).json({
      success: true,
      message: 'Check-in registrado',
      data,
    });
  } catch (error) {
    cleanupProgressPhotoFiles(req.files);
    return sendError(res, error, 'Error creando check-in:');
  }
}

/**
 * GET /api/checkins/client/:clientId
 */
async function listByClient(req, res) {
  try {
    const data = await checkinsService.listByClient(req.user, req.params.clientId);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando check-ins:');
  }
}

/**
 * GET /api/checkins/photos/:photoId
 */
async function getPhoto(req, res) {
  try {
    const { absolutePath } = await checkinsService.getPhotoForRequester(
      req.user,
      req.params.photoId,
    );
    res.set({
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.sendFile(absolutePath, (error) => {
      if (!error) return;
      console.error('Error enviando foto de check-in:', error);
      if (!res.headersSent) {
        sendError(res, error, 'Error enviando foto de check-in:');
      } else {
        res.destroy();
      }
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo foto de check-in:');
  }
}

module.exports = {
  create,
  getPhoto,
  listByClient,
};
