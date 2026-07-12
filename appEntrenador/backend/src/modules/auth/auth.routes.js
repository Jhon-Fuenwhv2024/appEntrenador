const express = require('express');
const authController = require('./auth.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post(
  '/generate-token',
  authenticate,
  requireRole('trainer'),
  authController.generateInvitation,
);

module.exports = router;
