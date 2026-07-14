const express = require('express');
const accountController = require('./account.controller');
const { authenticate, requireRole } = require('../../middleware/auth');
const { uploadAvatarMiddleware } = require('../../middleware/uploadAvatar');

const router = express.Router();

router.get(
  '/me/account',
  authenticate,
  requireRole('trainer', 'client'),
  accountController.getMine,
);

router.put(
  '/me/account',
  authenticate,
  requireRole('trainer', 'client'),
  uploadAvatarMiddleware,
  accountController.updateMine,
);

router.post(
  '/me/password',
  authenticate,
  requireRole('trainer', 'client'),
  accountController.changePassword,
);

module.exports = router;
