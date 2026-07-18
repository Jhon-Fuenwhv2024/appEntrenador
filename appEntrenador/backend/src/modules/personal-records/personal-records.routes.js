const express = require('express');
const personalRecordsController = require('./personal-records.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/me/personal-records',
  authenticate,
  requireRole('client'),
  personalRecordsController.listMine,
);

router.get(
  '/clients/:clientId/personal-records',
  authenticate,
  requireRole('trainer'),
  personalRecordsController.listForClient,
);

module.exports = router;
