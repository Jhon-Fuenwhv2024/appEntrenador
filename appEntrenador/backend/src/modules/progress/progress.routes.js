const express = require('express');
const progressController = require('./progress.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/progress/metrics/:clientId',
  authenticate,
  requireRole('trainer', 'client'),
  progressController.getMetrics,
);

router.get(
  '/progress/exercises/:clientId',
  authenticate,
  requireRole('trainer', 'client'),
  progressController.getExercises,
);

module.exports = router;
