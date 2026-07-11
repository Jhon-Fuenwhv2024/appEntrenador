const express = require('express');
const clientsController = require('./clients.controller');

const router = express.Router();

router.get('/clients', clientsController.getClients);

module.exports = router;
