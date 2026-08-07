const express = require('express');
const shadowModeController = require('./shadow-mode.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.patch(
  '/me/workout-live',
  authenticate,
  requireRole('client'),
  shadowModeController.upsertMyLive,
);

router.delete(
  '/me/workout-live',
  authenticate,
  requireRole('client'),
  shadowModeController.clearMyLive,
);

router.get(
  '/trainer/live-sessions',
  authenticate,
  requireRole('trainer'),
  shadowModeController.listLiveSessions,
);

router.post(
  '/trainer/live-sessions/:clientId/cues',
  authenticate,
  requireRole('trainer'),
  shadowModeController.postCue,
);

router.get(
  '/me/settings/shadow-mode',
  authenticate,
  requireRole('client'),
  shadowModeController.getShadowSettings,
);

router.patch(
  '/me/settings/shadow-mode',
  authenticate,
  requireRole('client'),
  shadowModeController.patchShadowSettings,
);

module.exports = router;
