const express = require('express');
const dietPlansController = require('./diet-plans.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

/** Cliente: plan activo del día resuelto (?date=YYYY-MM-DD) */
router.get(
  '/me/diet-plan',
  authenticate,
  requireRole('client'),
  dietPlansController.getMine,
);

/** Cliente: preview semana del ciclo (?date=YYYY-MM-DD) */
router.get(
  '/me/diet-plan/week',
  authenticate,
  requireRole('client'),
  dietPlansController.getMineWeek,
);

/** Cliente: lista de compra agregada del plan activo (ciclo completo) */
router.get(
  '/me/diet-plan/shopping-list',
  authenticate,
  requireRole('client'),
  dietPlansController.getMineShoppingList,
);

/** Cliente: marcar comida Comí / No comí (Feature 083) */
router.put(
  '/me/diet-meals/:mealId/adherence',
  authenticate,
  requireRole('client'),
  dietPlansController.upsertMealAdherence,
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

router.post(
  '/trainer/diets/:id/deactivate',
  authenticate,
  requireRole('trainer'),
  dietPlansController.deactivate,
);

router.post(
  '/trainer/diets/:id/copy-day',
  authenticate,
  requireRole('trainer'),
  dietPlansController.copyDay,
);

router.post(
  '/trainer/diets/:id/copy-week',
  authenticate,
  requireRole('trainer'),
  dietPlansController.copyWeek,
);

module.exports = router;
