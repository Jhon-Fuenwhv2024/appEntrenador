const programsService = require('./programs.service');

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

async function listPresets(_req, res) {
  try {
    return res.json({
      success: true,
      data: programsService.listPresets(),
    });
  } catch (error) {
    return sendError(res, error, 'Error listando presets de mesociclo:');
  }
}

async function list(req, res) {
  try {
    const data = await programsService.listPrograms(req.user.id);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, 'Error listando programas:');
  }
}

async function getById(req, res) {
  try {
    const data = await programsService.getProgramById(req.user.id, Number(req.params.id));
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo programa:');
  }
}

async function create(req, res) {
  try {
    const data = await programsService.createProgram(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Programa creado',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error creando programa:');
  }
}

async function update(req, res) {
  try {
    const data = await programsService.updateProgram(
      req.user.id,
      Number(req.params.id),
      req.body,
    );
    return res.json({
      success: true,
      message: 'Programa actualizado',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando programa:');
  }
}

async function remove(req, res) {
  try {
    await programsService.deleteProgram(req.user.id, Number(req.params.id));
    return res.json({
      success: true,
      message: 'Programa eliminado',
    });
  } catch (error) {
    return sendError(res, error, 'Error eliminando programa:');
  }
}

async function addPhase(req, res) {
  try {
    const data = await programsService.addPhase(
      req.user.id,
      Number(req.params.id),
      req.body,
    );
    return res.status(201).json({
      success: true,
      message: 'Mesociclo añadido',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error añadiendo mesociclo:');
  }
}

async function propagate(req, res) {
  try {
    const data = await programsService.propagatePhase(
      req.user.id,
      Number(req.params.id),
      Number(req.params.phaseId),
    );
    return res.json({
      success: true,
      message: 'Microciclos propagados desde semana 1',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error propagando microciclos:');
  }
}

async function upsertWeekDays(req, res) {
  try {
    const data = await programsService.upsertWeekDays(
      req.user.id,
      Number(req.params.id),
      Number(req.params.weekId),
      req.body,
    );
    return res.json({
      success: true,
      message: 'Días del microciclo actualizados',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando días del microciclo:');
  }
}

async function assign(req, res) {
  try {
    const data = await programsService.assignProgram(
      req.user.id,
      Number(req.params.id),
      req.body,
    );
    return res.status(201).json({
      success: true,
      message: 'Programa asignado y semana 1 materializada',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error asignando programa:');
  }
}

async function listClientAssignments(req, res) {
  try {
    const data = await programsService.listClientAssignments(
      req.user.id,
      Number(req.params.clientId),
    );
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, 'Error listando asignaciones:');
  }
}

async function advanceWeek(req, res) {
  try {
    const data = await programsService.advanceAssignmentWeek(
      req.user.id,
      Number(req.params.assignmentId),
    );
    return res.json({
      success: true,
      message: data.message || 'Microciclo avanzado',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error avanzando microciclo:');
  }
}

async function lastLifts(req, res) {
  try {
    const data = await programsService.getClientLastLifts(
      req.user.id,
      Number(req.params.clientId),
      req.query.names,
    );
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo últimos levantamientos:');
  }
}

module.exports = {
  listPresets,
  list,
  getById,
  create,
  update,
  remove,
  addPhase,
  propagate,
  upsertWeekDays,
  assign,
  listClientAssignments,
  advanceWeek,
  lastLifts,
};
