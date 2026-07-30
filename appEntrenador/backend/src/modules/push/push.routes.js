const express = require('express');
const { pushController } = require('./push.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole('trainer', 'client'));

router.get('/vapid-public-key', pushController.getVapidPublicKey);
router.post('/subscriptions', pushController.upsertSubscription);
router.delete('/subscriptions', pushController.deleteSubscription);

module.exports = router;
