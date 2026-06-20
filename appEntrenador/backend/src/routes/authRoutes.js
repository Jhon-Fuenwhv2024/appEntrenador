// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Definimos que cuando hagan un POST a /login, responda el controlador
router.post('/login', authController.login);

module.exports = router;