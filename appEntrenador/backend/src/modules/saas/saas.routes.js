const express = require('express');
const saasController = require('./saas.controller');
const { authenticate } = require('../../middleware/auth');
const requireSuperAdmin = require('../../middleware/requireSuperAdmin');

const router = express.Router();

router.get('/trainers', authenticate, requireSuperAdmin, saasController.getTrainers);
router.put(
  '/trainers/:id/plan',
  authenticate,
  requireSuperAdmin,
  saasController.updatePlan,
);

module.exports = router;
