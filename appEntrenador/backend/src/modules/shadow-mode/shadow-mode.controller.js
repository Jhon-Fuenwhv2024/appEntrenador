const shadowModeService = require('./shadow-mode.service');
const shadowSettingsService = require('./shadow-settings.service');

function sendError(res, error, context) {
  const code = Number(error.code) || 500;
  const message = error.message || 'Error interno del servidor.';

  console.error(context, error);

  return res.status(code).json({
    success: false,
    error: message,
    message,
    code,
  });
}

async function upsertMyLive(req, res) {
  try {
    const data = await shadowModeService.upsertMyLive(req.user.id, req.body || {});
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando workout-live:');
  }
}

async function clearMyLive(req, res) {
  try {
    const data = await shadowModeService.clearMyLive(req.user.id);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error limpiando workout-live:');
  }
}

async function listLiveSessions(req, res) {
  try {
    const sessions = await shadowModeService.listLiveForTrainer(req.user.id);
    return res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando live-sessions:');
  }
}

async function postCue(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const data = await shadowModeService.postCue(
      req.user.id,
      clientId,
      req.body || {},
    );
    return res.status(201).json({
      success: true,
      message: 'Cue enviado',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error enviando cue:');
  }
}

async function getShadowSettings(req, res) {
  try {
    const data = await shadowSettingsService.getForClient(req.user.id);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo shadow-mode settings:');
  }
}

async function patchShadowSettings(req, res) {
  try {
    const data = await shadowSettingsService.upsertForClient(
      req.user.id,
      req.body || {},
    );
    return res.json({
      success: true,
      message: 'Preferencia de modo sombra actualizada',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando shadow-mode settings:');
  }
}

module.exports = {
  upsertMyLive,
  clearMyLive,
  listLiveSessions,
  postCue,
  getShadowSettings,
  patchShadowSettings,
};
