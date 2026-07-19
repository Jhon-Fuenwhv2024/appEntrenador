const express = require('express');
const adminExercisesController = require('./admin-exercises.controller');
const { authenticate } = require('../../middleware/auth');
const requireSuperAdmin = require('../../middleware/requireSuperAdmin');

const router = express.Router();

router.get(
  '/exercises/untagged',
  authenticate,
  requireSuperAdmin,
  adminExercisesController.getUntagged,
);

router.patch(
  '/exercises/:id/tag',
  authenticate,
  requireSuperAdmin,
  adminExercisesController.tagExercise,
);

module.exports = router;
