const express = require('express');
const profileController = require('./profile.controller');
const { authenticate, requireRole } = require('../../middleware/auth');
const { uploadAvatarMiddleware } = require('../../middleware/uploadAvatar');

const router = express.Router();

router.get(
  '/profile/:userId',
  authenticate,
  requireRole('trainer', 'client'),
  profileController.getByUserId,
);

router.put(
  '/profile/:userId',
  authenticate,
  requireRole('trainer', 'client'),
  profileController.authorizeByUserId,
  uploadAvatarMiddleware,
  profileController.upsertByUserId,
);

module.exports = router;
