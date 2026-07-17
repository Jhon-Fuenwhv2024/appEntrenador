const express = require('express');
const clientsController = require('./clients.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.get(
  '/trainer/dashboard',
  authenticate,
  requireRole('trainer'),
  clientsController.getDashboard,
);
router.get('/clients', authenticate, requireRole('trainer'), clientsController.getClients);
router.get(
  '/clients/:clientId/overview',
  authenticate,
  requireRole('trainer'),
  clientsController.getClientOverview,
);
router.get(
  '/clients/:clientId',
  authenticate,
  requireRole('trainer'),
  clientsController.getClientById,
);

module.exports = router;
