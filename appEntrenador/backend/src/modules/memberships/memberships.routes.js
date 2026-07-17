const express = require('express');
const membershipsController = require('./memberships.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/me/membership',
  authenticate,
  requireRole('client'),
  membershipsController.getMine,
);

router.get(
  '/clients/:clientId/membership',
  authenticate,
  requireRole('trainer'),
  membershipsController.getForClientAsTrainer,
);

router.put(
  '/clients/:clientId/membership',
  authenticate,
  requireRole('trainer'),
  membershipsController.upsertForClientAsTrainer,
);

module.exports = router;
