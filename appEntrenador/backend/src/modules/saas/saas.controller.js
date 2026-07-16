const saasService = require('./saas.service');

const ALLOWED_PLANS = new Set(['FREE', 'PRO']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function sendError(res, error, context) {
  const code = error.code || 500;
  const message = error.message || 'Error interno del servidor';

  console.error(context, error);

  return res.status(code).json({
    success: false,
    error: message,
    message,
    code,
  });
}

async function getTrainers(req, res) {
  try {
    const trainers = await saasService.listAllTrainers();

    return res.json({
      success: true,
      data: trainers,
    });
  } catch (error) {
    return sendError(res, error, 'Error al listar trainers SaaS:');
  }
}

async function updatePlan(req, res) {
  try {
    const trainerId = Number(req.params.id);
    const { saas_plan: plan, saas_expiration_date: expirationRaw } = req.body || {};

    if (!ALLOWED_PLANS.has(plan)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PLAN',
        message: "saas_plan debe ser 'FREE' o 'PRO'.",
        code: 400,
      });
    }

    let expirationDate = null;
    if (expirationRaw !== undefined && expirationRaw !== null && expirationRaw !== '') {
      const asString = String(expirationRaw).trim();
      if (!DATE_RE.test(asString)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_DATE',
          message: 'saas_expiration_date debe ser YYYY-MM-DD o null.',
          code: 400,
        });
      }
      expirationDate = asString;
    }

    const data = await saasService.updateTrainerPlan(trainerId, plan, expirationDate);

    return res.json({
      success: true,
      message: 'Plan actualizado exitosamente',
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error al actualizar plan SaaS:');
  }
}

module.exports = {
  getTrainers,
  updatePlan,
};
