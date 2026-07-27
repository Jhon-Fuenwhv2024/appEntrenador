const foodLookupService = require('./food-lookup.service');

function sendError(res, error, context) {
  const code = error.code || 500;
  const message = error.message || 'Error interno del servidor.';
  const errorKey = error.error || message;

  console.error(context, error);

  return res.status(code).json({
    success: false,
    error: errorKey,
    message,
    code: error.error || code,
  });
}

async function search(req, res) {
  try {
    const q = String(req.query.q || '').trim();
    const data = await foodLookupService.searchFoods(q);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error buscando alimentos:');
  }
}

async function lookup(req, res) {
  try {
    const data = await foodLookupService.lookupFood({
      q: req.query.q,
      quantity: req.query.quantity,
      unit: req.query.unit,
      fdcId: req.query.fdcId,
    });
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error, 'Error en lookup nutricional:');
  }
}

module.exports = {
  search,
  lookup,
};
