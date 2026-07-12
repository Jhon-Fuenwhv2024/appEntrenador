const express = require('express');
const clientsController = require('./clients.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get('/clients', authenticate, requireRole('trainer'), clientsController.getClients);
router.get(
  '/clients/:clientId',
  authenticate,
  requireRole('trainer'),
  clientsController.getClientById,
);

module.exports = router;
