const express = require('express');
const authController = require('./auth.controller');
const invitesController = require('../invites/invites.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.register);

// Alias de compatibilidad (Feature 023): preferir POST /api/invites
router.post(
  '/generate-token',
  authenticate,
  requireRole('trainer'),
  invitesController.create,
);

module.exports = router;
