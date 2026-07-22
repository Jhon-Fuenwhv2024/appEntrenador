const express = require('express');
const routinesController = require('./routines.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/me/routines',
  authenticate,
  requireRole('client'),
  routinesController.listMine,
);

/** Feature 038 — agregador dashboard cliente (rutina hoy + hábitos + macros). */
router.get(
  '/me/today',
  authenticate,
  requireRole('client'),
  routinesController.getToday,
);

router.get(
  '/clients/:clientId/routines',
  authenticate,
  requireRole('trainer'),
  routinesController.listForClient,
);

router.post(
  '/clients/:clientId/routines',
  authenticate,
  requireRole('trainer'),
  routinesController.create,
);

router.put(
  '/routines/:routineId',
  authenticate,
  requireRole('trainer'),
  routinesController.update,
);

router.post(
  '/routines/:routineId/exercises',
  authenticate,
  requireRole('trainer'),
  routinesController.appendExercise,
);

router.delete(
  '/routines/:routineId',
  authenticate,
  requireRole('trainer'),
  routinesController.remove,
);

module.exports = router;
