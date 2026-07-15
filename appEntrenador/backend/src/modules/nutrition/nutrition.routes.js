const express = require('express');
const nutritionController = require('./nutrition.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/nutrition/:clientId',
  authenticate,
  requireRole('trainer', 'client'),
  nutritionController.getByClientId,
);

router.put(
  '/nutrition/:clientId',
  authenticate,
  requireRole('trainer'),
  nutritionController.upsertByClientId,
);

module.exports = router;
