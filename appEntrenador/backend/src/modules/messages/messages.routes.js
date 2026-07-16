const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const { messagesController, authenticateSse } = require('./messages.controller');

const router = express.Router();

// SSE: auth via Bearer or ?token= (EventSource cannot set headers)
router.get(
  '/stream',
  authenticateSse,
  messagesController.stream,
);

router.get(
  '/partner',
  authenticate,
  requireRole('client'),
  messagesController.getPartner,
);

router.get(
  '/:partnerId',
  authenticate,
  requireRole('trainer', 'client'),
  messagesController.getConversation,
);

router.post(
  '/',
  authenticate,
  requireRole('trainer', 'client'),
  messagesController.sendMessage,
);

module.exports = router;
