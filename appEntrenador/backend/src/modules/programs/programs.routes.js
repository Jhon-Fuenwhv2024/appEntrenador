const express = require('express');
const programsController = require('./programs.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/programs/presets',
  authenticate,
  requireRole('trainer'),
  programsController.listPresets,
);

router.get(
  '/programs',
  authenticate,
  requireRole('trainer'),
  programsController.list,
);

router.post(
  '/programs',
  authenticate,
  requireRole('trainer'),
  programsController.create,
);

router.get(
  '/programs/:id',
  authenticate,
  requireRole('trainer'),
  programsController.getById,
);

router.patch(
  '/programs/:id',
  authenticate,
  requireRole('trainer'),
  programsController.update,
);

router.delete(
  '/programs/:id',
  authenticate,
  requireRole('trainer'),
  programsController.remove,
);

router.post(
  '/programs/:id/phases',
  authenticate,
  requireRole('trainer'),
  programsController.addPhase,
);

router.post(
  '/programs/:id/phases/:phaseId/propagate',
  authenticate,
  requireRole('trainer'),
  programsController.propagate,
);

router.put(
  '/programs/:id/weeks/:weekId/days',
  authenticate,
  requireRole('trainer'),
  programsController.upsertWeekDays,
);

router.post(
  '/programs/:id/assign',
  authenticate,
  requireRole('trainer'),
  programsController.assign,
);

router.get(
  '/clients/:clientId/program-assignments',
  authenticate,
  requireRole('trainer'),
  programsController.listClientAssignments,
);

router.post(
  '/program-assignments/:assignmentId/advance-week',
  authenticate,
  requireRole('trainer'),
  programsController.advanceWeek,
);

router.get(
  '/clients/:clientId/last-lifts',
  authenticate,
  requireRole('trainer'),
  programsController.lastLifts,
);

module.exports = router;
