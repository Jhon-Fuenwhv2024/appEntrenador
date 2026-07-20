const express = require('express');
const checkinsController = require('./checkins.controller');
const { authenticate, requireRole } = require('../../middleware/auth');
const { uploadProgressPhotosMiddleware } = require('../../middleware/uploadProgressPhotos');

const router = express.Router();

router.post(
  '/checkins',
  authenticate,
  requireRole('client'),
  uploadProgressPhotosMiddleware,
  checkinsController.create,
);

router.get(
  '/checkins/client/:clientId',
  authenticate,
  requireRole('trainer', 'client'),
  checkinsController.listByClient,
);

router.patch(
  '/checkins/:id/review',
  authenticate,
  requireRole('trainer'),
  checkinsController.markReviewed,
);

module.exports = router;
