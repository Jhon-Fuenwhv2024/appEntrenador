const routinesService = require('./routines.service');

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

async function listForClient(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const routines = await routinesService.listRoutinesForClientAsTrainer(
      req.user.id,
      clientId,
    );

    return res.json({
      success: true,
      data: routines,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando rutinas:');
  }
}

async function listMine(req, res) {
  try {
    const routines = await routinesService.listMyRoutines(req.user.id);

    return res.json({
      success: true,
      data: routines,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando mis rutinas:');
  }
}

async function create(req, res) {
  try {
    const clientId = Number(req.params.clientId);
    const routine = await routinesService.createRoutine(
      req.user.id,
      clientId,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: 'Rutina creada',
      data: routine,
    });
  } catch (error) {
    return sendError(res, error, 'Error creando rutina:');
  }
}

async function update(req, res) {
  try {
    const routineId = Number(req.params.routineId);
    const routine = await routinesService.updateRoutine(
      req.user.id,
      routineId,
      req.body,
    );

    return res.json({
      success: true,
      message: 'Rutina actualizada',
      data: routine,
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando rutina:');
  }
}

async function remove(req, res) {
  try {
    const routineId = Number(req.params.routineId);
    await routinesService.deleteRoutine(req.user.id, routineId);

    return res.json({
      success: true,
      message: 'Rutina eliminada',
    });
  } catch (error) {
    return sendError(res, error, 'Error eliminando rutina:');
  }
}

module.exports = {
  listForClient,
  listMine,
  create,
  update,
  remove,
};
