const exercisesService = require('./exercises.service');

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

async function list(req, res) {
  try {
    const result = await exercisesService.listExercisesForTrainer(
      req.user.id,
      req.query.q,
      req.query.limit,
      req.query.page,
    );

    return res.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        limit: result.limit,
        page: result.page,
        totalPages: result.totalPages,
        returned: result.items.length,
      },
    });
  } catch (error) {
    return sendError(res, error, 'Error listando catálogo de ejercicios:');
  }
}

async function create(req, res) {
  try {
    const exercise = await exercisesService.createExerciseForTrainer(
      req.user.id,
      req.body || {},
    );

    return res.status(201).json({
      success: true,
      data: exercise,
      message: 'Ejercicio añadido al catálogo',
    });
  } catch (error) {
    return sendError(res, error, 'Error creando ejercicio en catálogo:');
  }
}

async function update(req, res) {
  try {
    const exercise = await exercisesService.updateExerciseForTrainer(
      req.user.id,
      req.params.id,
      req.body || {},
    );

    return res.json({
      success: true,
      data: exercise,
      message: 'Ejercicio actualizado',
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando ejercicio:');
  }
}

async function remove(req, res) {
  try {
    const deleted = await exercisesService.deleteExerciseForTrainer(
      req.user.id,
      req.params.id,
    );

    return res.json({
      success: true,
      data: deleted,
      message: 'Ejercicio eliminado',
    });
  } catch (error) {
    return sendError(res, error, 'Error eliminando ejercicio:');
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
};
