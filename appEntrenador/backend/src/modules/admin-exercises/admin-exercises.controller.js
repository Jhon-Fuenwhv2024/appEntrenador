const adminExercisesService = require('./admin-exercises.service');

function sendError(res, error, context) {
  const code = Number.isInteger(error.statusCode)
    ? error.statusCode
    : (Number.isInteger(error.code) ? error.code : 500);
  const message = error.message || 'Error interno del servidor';

  console.error(context, error);

  return res.status(code).json({
    success: false,
    error: message,
    message,
    code,
  });
}

/**
 * GET /api/admin/exercises/untagged
 */
async function getUntagged(req, res) {
  try {
    const [exercise, progress] = await Promise.all([
      adminExercisesService.getNextUntaggedExercise(),
      adminExercisesService.getTaggingProgress(),
    ]);

    return res.status(200).json({
      success: true,
      data: exercise,
      meta: progress,
      message: exercise
        ? 'Ejercicio pendiente de etiquetar'
        : 'Catálogo completado',
    });
  } catch (error) {
    return sendError(res, error, 'Error al obtener ejercicio sin etiquetar:');
  }
}

/**
 * PATCH /api/admin/exercises/:id/tag
 */
async function tagExercise(req, res) {
  try {
    const data = await adminExercisesService.tagExercise(req.params.id, req.body || {});

    return res.status(200).json({
      success: true,
      data,
      message: 'Etiquetas guardadas',
    });
  } catch (error) {
    return sendError(res, error, 'Error al etiquetar ejercicio:');
  }
}

module.exports = {
  getUntagged,
  tagExercise,
};
