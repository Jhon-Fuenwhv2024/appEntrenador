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

router.delete(
  '/routines/:routineId',
  authenticate,
  requireRole('trainer'),
  routinesController.remove,
);

module.exports = router;
