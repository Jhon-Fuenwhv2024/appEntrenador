const express = require('express');
const foodLookupController = require('./food-lookup.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

/** Sugerencias para autocomplete (trainer) */
router.get(
  '/trainer/foods/search',
  authenticate,
  requireRole('trainer'),
  foodLookupController.search,
);

/** Lookup macros escalados (trainer) */
router.get(
  '/trainer/foods/lookup',
  authenticate,
  requireRole('trainer'),
  foodLookupController.lookup,
);

module.exports = router;
