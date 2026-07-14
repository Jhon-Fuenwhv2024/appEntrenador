const express = require('express');
const templatesController = require('./templates.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/templates',
  authenticate,
  requireRole('trainer'),
  templatesController.list,
);

router.post(
  '/templates',
  authenticate,
  requireRole('trainer'),
  templatesController.create,
);

router.get(
  '/templates/:id',
  authenticate,
  requireRole('trainer'),
  templatesController.getById,
);

router.patch(
  '/templates/:id',
  authenticate,
  requireRole('trainer'),
  templatesController.update,
);

router.delete(
  '/templates/:id',
  authenticate,
  requireRole('trainer'),
  templatesController.remove,
);

router.post(
  '/templates/:id/assign',
  authenticate,
  requireRole('trainer'),
  templatesController.assign,
);

module.exports = router;
