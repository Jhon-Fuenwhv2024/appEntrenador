const progressService = require('./progress.service');

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

/**
 * GET /api/progress/metrics/:clientId
 */
async function getMetrics(req, res) {
  try {
    const data = await progressService.getMetricsProgress(
      req.user,
      req.params.clientId,
    );
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo métricas de progreso:');
  }
}

/**
 * GET /api/progress/exercises/:clientId
 * Sin query: lista ejercicios con logs (selector).
 * Con ?exerciseId= o ?exerciseName=: serie MAX(weight) por día.
 */
async function getExercises(req, res) {
  try {
    const { exerciseId, exerciseName } = req.query;
    const hasFilter = (exerciseId != null && exerciseId !== '')
      || (typeof exerciseName === 'string' && exerciseName.trim() !== '');

    if (!hasFilter) {
      const exercises = await progressService.listLoggedExercises(
        req.user,
        req.params.clientId,
      );
      return res.json({
        success: true,
        data: { exercises },
      });
    }

    const data = await progressService.getExerciseProgress(
      req.user,
      req.params.clientId,
      { exerciseId, exerciseName },
    );
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo progreso de ejercicios:');
  }
}

module.exports = {
  getMetrics,
  getExercises,
};
