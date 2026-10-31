const templatesService = require('./quotationTemplates.service');

async function listTemplates(req, res, next) {
  try {
    const { search, status, page, limit } = req.query;
    const result = await templatesService.getTemplates({ search, status, page, limit });
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (err) {
    next(err);
  }
}

async function getTemplate(req, res, next) {
  try {
    const { id } = req.params;
    const template = await templatesService.getTemplateById(id);
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (err) {
    next(err);
  }
}

async function createTemplate(req, res, next) {
  try {
    const creatorAuthId = req.user ? req.user.id : null;
    const newTemplate = await templatesService.createTemplate(req.body, creatorAuthId);
    res.status(201).json({
      success: true,
      message: 'Quotation template created successfully.',
      data: newTemplate
    });
  } catch (err) {
    next(err);
  }
}

async function updateTemplate(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await templatesService.updateTemplate(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Quotation template updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function toggleTemplateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const updated = await templatesService.toggleTemplateStatus(id, is_active);
    res.status(200).json({
      success: true,
      message: `Template status updated to ${updated.is_active ? 'active' : 'inactive'}.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deleteTemplate(req, res, next) {
  try {
    const { id } = req.params;
    const result = await templatesService.deleteTemplate(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  toggleTemplateStatus,
  deleteTemplate
};
