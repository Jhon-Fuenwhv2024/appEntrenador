const templatesService = require('./templates.service');

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
    const templates = await templatesService.listTemplates(req.user.id);

    return res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    return sendError(res, error, 'Error listando plantillas:');
  }
}

async function getById(req, res) {
  try {
    const templateId = Number(req.params.id);
    const template = await templatesService.getTemplateById(req.user.id, templateId);

    return res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    return sendError(res, error, 'Error obteniendo plantilla:');
  }
}

async function create(req, res) {
  try {
    const template = await templatesService.createTemplate(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: 'Plantilla creada',
      data: template,
    });
  } catch (error) {
    return sendError(res, error, 'Error creando plantilla:');
  }
}

async function update(req, res) {
  try {
    const templateId = Number(req.params.id);
    const template = await templatesService.updateTemplate(
      req.user.id,
      templateId,
      req.body,
    );

    return res.json({
      success: true,
      message: 'Plantilla actualizada',
      data: template,
    });
  } catch (error) {
    return sendError(res, error, 'Error actualizando plantilla:');
  }
}

async function remove(req, res) {
  try {
    const templateId = Number(req.params.id);
    await templatesService.deleteTemplate(req.user.id, templateId);

    return res.json({
      success: true,
      message: 'Plantilla eliminada',
    });
  } catch (error) {
    return sendError(res, error, 'Error eliminando plantilla:');
  }
}

async function assign(req, res) {
  try {
    const templateId = Number(req.params.id);
    const routine = await templatesService.assignTemplate(
      req.user.id,
      templateId,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: 'Plantilla asignada (copia creada)',
      data: routine,
    });
  } catch (error) {
    return sendError(res, error, 'Error asignando plantilla:');
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  assign,
};
