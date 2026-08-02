const express = require('express');
const gymMembershipController = require('./gym-membership.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/me/gym-membership',
  authenticate,
  requireRole('client'),
  gymMembershipController.getMine,
);

router.put(
  '/me/gym-membership',
  authenticate,
  requireRole('client'),
  gymMembershipController.upsertMine,
);

router.delete(
  '/me/gym-membership',
  authenticate,
  requireRole('client'),
  gymMembershipController.deleteMine,
);

module.exports = router;
