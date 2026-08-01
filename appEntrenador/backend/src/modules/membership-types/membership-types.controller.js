const membershipTypesService = require('./membership-types.service');

function sendError(res, error, context) {
  const httpStatus = Number(error.code) || 500;
  const message = error.message || 'Error interno del servidor.';
  const errorKey = error.error || message;
  console.error(context, error);
  return res.status(httpStatus).json({
    success: false,
    error: errorKey,
    message,
    code: error.error || httpStatus,
  });
}

async function list(req, res) {
  try {
    const includeInactive = req.query.include_inactive === '1'
      || req.query.include_inactive === 'true';
    const data = await membershipTypesService.listForTrainer(req.user.id, { includeInactive });
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, 'Error listando tipos de membresía:');
  }
}

async function create(req, res) {
  try {
    const data = await membershipTypesService.createForTrainer(req.user.id, req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return sendError(res, error, 'Error creando tipo de membresía:');
  }
}

async function update(req, res) {
  try {
    const data = await membershipTypesService.updateForTrainer(
      req.user.id,
      req.params.id,
      req.body,
    );
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, 'Error actualizando tipo de membresía:');
  }
}

async function remove(req, res) {
  try {
    const data = await membershipTypesService.removeForTrainer(req.user.id, req.params.id);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, 'Error eliminando tipo de membresía:');
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
};
