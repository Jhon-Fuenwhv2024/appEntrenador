const express = require('express');
const { notificationsController } = require('./notifications.controller');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole('trainer', 'client'));

router.get('/', notificationsController.getNotifications);
router.put('/read-all', notificationsController.markAllAsRead);
router.put('/:id/read', notificationsController.markAsRead);

module.exports = router;
