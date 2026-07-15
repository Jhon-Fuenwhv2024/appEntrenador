const express = require('express');
const habitsController = require('./habits.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

// Rutas estáticas / anidadas antes de /:id
router.get(
  '/habits/today',
  authenticate,
  requireRole('client'),
  habitsController.listToday,
);

router.get(
  '/habits/client/:clientId',
  authenticate,
  requireRole('trainer'),
  habitsController.listByClient,
);

router.post(
  '/habits/client/:clientId',
  authenticate,
  requireRole('trainer'),
  habitsController.createForClient,
);

router.post(
  '/habits/:id/toggle',
  authenticate,
  requireRole('client'),
  habitsController.toggle,
);

router.delete(
  '/habits/:id',
  authenticate,
  requireRole('trainer'),
  habitsController.remove,
);

module.exports = router;
