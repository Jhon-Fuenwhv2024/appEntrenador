const express = require('express');
const dietPlansController = require('./diet-plans.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

/** Cliente: plan activo del alumno autenticado */
router.get(
  '/me/diet-plan',
  authenticate,
  requireRole('client'),
  dietPlansController.getMine,
);

/** Entrenador: CRUD de planes de dieta */
router.get(
  '/trainer/diets',
  authenticate,
  requireRole('trainer'),
  dietPlansController.list,
);

router.post(
  '/trainer/diets',
  authenticate,
  requireRole('trainer'),
  dietPlansController.create,
);

router.get(
  '/trainer/diets/:id',
  authenticate,
  requireRole('trainer'),
  dietPlansController.getById,
);

router.put(
  '/trainer/diets/:id',
  authenticate,
  requireRole('trainer'),
  dietPlansController.update,
);

router.delete(
  '/trainer/diets/:id',
  authenticate,
  requireRole('trainer'),
  dietPlansController.remove,
);

router.post(
  '/trainer/diets/:id/activate',
  authenticate,
  requireRole('trainer'),
  dietPlansController.activate,
);

module.exports = router;
