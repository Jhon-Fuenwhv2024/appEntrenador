const express = require('express');
const membershipTypesController = require('./membership-types.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/trainer/membership-types',
  authenticate,
  requireRole('trainer'),
  membershipTypesController.list,
);

router.post(
  '/trainer/membership-types',
  authenticate,
  requireRole('trainer'),
  membershipTypesController.create,
);

router.put(
  '/trainer/membership-types/:id',
  authenticate,
  requireRole('trainer'),
  membershipTypesController.update,
);

router.delete(
  '/trainer/membership-types/:id',
  authenticate,
  requireRole('trainer'),
  membershipTypesController.remove,
);

module.exports = router;
