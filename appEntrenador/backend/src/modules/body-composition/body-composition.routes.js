const express = require('express');
const bodyCompositionController = require('./body-composition.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/me/body-composition',
  authenticate,
  requireRole('client'),
  bodyCompositionController.listMine,
);

router.get(
  '/clients/:clientId/body-composition',
  authenticate,
  requireRole('trainer'),
  bodyCompositionController.listForClient,
);

router.post(
  '/clients/:clientId/body-composition',
  authenticate,
  requireRole('trainer'),
  bodyCompositionController.createForClient,
);

router.put(
  '/clients/:clientId/body-composition/:logId',
  authenticate,
  requireRole('trainer'),
  bodyCompositionController.updateForClient,
);

module.exports = router;
