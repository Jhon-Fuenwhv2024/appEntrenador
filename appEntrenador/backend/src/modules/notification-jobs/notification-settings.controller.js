const notificationSettingsService = require('./notification-settings.service');

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

async function getMine(req, res) {
  try {
    const data = await notificationSettingsService.getForClient(req.user.id);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo notification-settings:');
  }
}

async function updateMine(req, res) {
  try {
    const data = await notificationSettingsService.upsertForClient(
      req.user.id,
      req.body || {},
    );
    return res.json({
      success: true,
      message: 'Preferencias de notificación actualizadas',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando notification-settings:');
  }
}

module.exports = {
  getMine,
  updateMine,
};
