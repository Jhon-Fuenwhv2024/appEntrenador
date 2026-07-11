const express = require('express');
const authController = require('./auth.controller');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/generate-token', authController.generateInvitation);

module.exports = router;
