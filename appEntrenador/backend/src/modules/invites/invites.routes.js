const express = require('express');
const invitesController = require('./invites.controller');
const { authenticate, requireRole } = require('../../middleware/auth');
const checkTrainerLimits = require('../../middleware/checkTrainerLimits');

const router = express.Router();

router.post(
  '/',
  authenticate,
  requireRole('trainer'),
  checkTrainerLimits,
  invitesController.create,
);
router.get('/', authenticate, requireRole('trainer'), invitesController.list);
router.patch(
  '/:id/revoke',
  authenticate,
  requireRole('trainer'),
  invitesController.revoke,
);

module.exports = router;
