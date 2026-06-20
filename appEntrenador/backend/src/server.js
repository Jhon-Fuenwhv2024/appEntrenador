// src/server.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = 3000;

// Middleware de seguridad y lectura de datos JSON
app.use(cors());
app.use(express.json());

// Registro modular de rutas (todas empezarán con /api)
app.use('/api', authRoutes);

// Encender el backend
app.listen(PORT, () => {
    console.log(`🚀 Servidor API modular corriendo en http://localhost:${PORT}`);
});