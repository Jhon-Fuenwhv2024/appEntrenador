const dietPlansService = require('./diet-plans.service');
const membershipsService = require('../memberships/memberships.service');

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
    const plans = await dietPlansService.listDietPlans(
      req.user.id,
      req.query.clientId,
    );

    return res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando planes de dieta:');
  }
}

async function getById(req, res) {
  try {
    const plan = await dietPlansService.getDietPlanForTrainer(
      req.user.id,
      req.params.id,
    );

    return res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo plan de dieta:');
  }
}

async function create(req, res) {
  try {
    const plan = await dietPlansService.createDietPlan(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: 'Plan de dieta creado',
      data: plan,
    });
  } catch (error) {
    return sendError(res, error, 'Error creando plan de dieta:');
  }
}

async function update(req, res) {
  try {
    const plan = await dietPlansService.updateDietPlan(
      req.user.id,
      req.params.id,
      req.body,
    );

    return res.json({
      success: true,
      message: 'Plan de dieta actualizado',
      data: plan,
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando plan de dieta:');
  }
}

async function remove(req, res) {
  try {
    await dietPlansService.deleteDietPlan(req.user.id, req.params.id);

    return res.json({
      success: true,
      message: 'Plan de dieta eliminado',
    });
  } catch (error) {
    return sendError(res, error, 'Error eliminando plan de dieta:');
  }
}

async function activate(req, res) {
  try {
    const plan = await dietPlansService.activateDietPlan(
      req.user.id,
      req.params.id,
    );

    return res.json({
      success: true,
      message: 'Plan de dieta activado',
      data: plan,
    });
  } catch (error) {
    return sendError(res, error, 'Error activando plan de dieta:');
  }
}

async function copyDay(req, res) {
  try {
    const plan = await dietPlansService.copyDay(
      req.user.id,
      req.params.id,
      req.body,
    );

    return res.json({
      success: true,
      message: 'Día duplicado',
      data: plan,
    });
  } catch (error) {
    return sendError(res, error, 'Error duplicando día de dieta:');
  }
}

async function copyWeek(req, res) {
  try {
    const plan = await dietPlansService.copyWeek(
      req.user.id,
      req.params.id,
      req.body,
    );

    return res.json({
      success: true,
      message: 'Semana duplicada',
      data: plan,
    });
  } catch (error) {
    return sendError(res, error, 'Error duplicando semana de dieta:');
  }
}

async function getMine(req, res) {
  try {
    await membershipsService.assertClientMembershipAccess(req.user.id);
    const plan = await dietPlansService.getActiveDietPlanForClient(
      req.user.id,
      req.query.date,
    );

    return res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo mi plan de dieta:');
  }
}

async function getMineWeek(req, res) {
  try {
    await membershipsService.assertClientMembershipAccess(req.user.id);
    const week = await dietPlansService.getActiveDietPlanWeekForClient(
      req.user.id,
      req.query.date,
    );

    return res.json({
      success: true,
      data: week,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo semana del plan de dieta:');
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  activate,
  copyDay,
  copyWeek,
  getMine,
  getMineWeek,
};
