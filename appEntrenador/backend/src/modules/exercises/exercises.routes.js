const express = require('express');
const exercisesController = require('./exercises.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

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
  exercisesController.create,
);

router.put(
  '/exercises/:id',
  authenticate,
  requireRole('trainer'),
  exercisesController.update,
);

router.delete(
  '/exercises/:id',
  authenticate,
  requireRole('trainer'),
  exercisesController.remove,
);

module.exports = router;
