// src/controllers/authController.js
const db = require('../config/db');

exports.login = async (req, requireResponse) => {
    const { username, password } = req.body;

    try {
        // Hacemos la consulta usando el pool asíncrono
        const [rows] = await db.query(
            'SELECT id, username, nombre, rol FROM usuarios WHERE username = ? AND password = ?', 
            [username, password]
        );

        if (rows.length > 0) {
            return req.res.json({
                success: true,
                message: '¡Login correcto!',
                user: rows[0]
            });
        } else {
            return req.res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos.'
            });
        }
    } catch (error) {
        console.error('Error en el controlador de Login:', error);
        return req.res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
};