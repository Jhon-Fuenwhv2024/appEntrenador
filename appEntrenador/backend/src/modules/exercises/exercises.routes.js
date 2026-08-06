const express = require('express');
const exercisesController = require('./exercises.controller');
const { authenticate, requireRole } = require('../../middleware/auth');
const { uploadExerciseMediaMiddleware } = require('../../middleware/uploadExerciseMedia');

const router = express.Router();

router.get(
  '/exercises',
  authenticate,
  requireRole('trainer'),
  exercisesController.list,
);

router.post(
  '/exercises',
  authenticate,
  requireRole('trainer'),
  uploadExerciseMediaMiddleware,
  exercisesController.create,
);

router.put(
  '/exercises/:id',
  authenticate,
  requireRole('trainer'),
  uploadExerciseMediaMiddleware,
  exercisesController.update,
);

router.delete(
  '/exercises/:id',
  authenticate,
  requireRole('trainer'),
  exercisesController.remove,
);

module.exports = router;
