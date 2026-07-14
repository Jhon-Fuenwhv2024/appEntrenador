const express = require('express');
const workoutSessionsController = require('./workout-sessions.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.post(
  '/me/workout-sessions',
  authenticate,
  requireRole('client'),
  workoutSessionsController.createMine,
);

router.get(
  '/me/workout-sessions',
  authenticate,
  requireRole('client'),
  workoutSessionsController.listMine,
);

router.get(
  '/clients/:clientId/workout-sessions',
  authenticate,
  requireRole('trainer'),
  workoutSessionsController.listForClient,
);

module.exports = router;
