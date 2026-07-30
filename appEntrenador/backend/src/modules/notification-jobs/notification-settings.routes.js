const express = require('express');
const notificationSettingsController = require('./notification-settings.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/me/notification-settings',
  authenticate,
  requireRole('client'),
  notificationSettingsController.getMine,
);

router.put(
  '/me/notification-settings',
  authenticate,
  requireRole('client'),
  notificationSettingsController.updateMine,
);

module.exports = router;
