const express = require('express');
const consistencyController = require('./consistency.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/me/consistency',
  authenticate,
  requireRole('client'),
  consistencyController.getMine,
);

router.get(
  '/clients/:clientId/consistency',
  authenticate,
  requireRole('trainer'),
  consistencyController.getForClient,
);

router.put(
  '/clients/:clientId/consistency',
  authenticate,
  requireRole('trainer'),
  consistencyController.updateWeekGoal,
);

router.put(
  '/clients/:clientId/week-goal',
  authenticate,
  requireRole('trainer'),
  consistencyController.updateWeekGoal,
);

module.exports = router;
