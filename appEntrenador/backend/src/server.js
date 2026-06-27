// src/server.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const db = require('./config/db');

const app = express();
const PORT = 3000;

// Middleware de seguridad y lectura de datos JSON
app.use(cors());
app.use(express.json());

// Registro modular de rutas (todas empezarán con /api)
app.use('/api', authRoutes);

// ==========================================
// RUTA PARA OBTENER LOS ALUMNOS (VERSIÓN PROMESAS)
// ==========================================
app.get('/api/clients', async (req, res) => {
  try {
    // 1. Preparamos la consulta
    const query = 'SELECT id, nombre, username FROM usuarios WHERE rol = "client"';
    
    // 2. Usamos 'await' para esperar la respuesta de la base de datos.
    // Al usar promesas, db.query devuelve un arreglo donde el primer elemento son los resultados.
    const [results] = await db.query(query);

    // 3. Enviamos los resultados al frontend (tu Dashboard de Vue)
    res.json({
      success: true,
      clients: results
    });

  } catch (error) {
    // 4. Si algo falla, este bloque 'catch' atrapará el error automáticamente
    console.error('Error al consultar la base de datos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// Encender el backend
app.listen(PORT, () => {
    console.log(`🚀 Servidor API modular corriendo en http://localhost:${PORT}`);
});