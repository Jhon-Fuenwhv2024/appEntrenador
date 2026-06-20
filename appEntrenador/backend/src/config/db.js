// src/config/db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',      // Vacío por defecto en XAMPP
    database: 'coach_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exportamos el "pool" para usarlo en los controladores
module.exports = pool.promise();