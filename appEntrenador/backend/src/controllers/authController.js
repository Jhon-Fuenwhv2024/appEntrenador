// src/controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Buscamos PRIMERO solo por el nombre de usuario
        const [rows] = await db.query(
            'SELECT id, username, nombre, rol, password FROM usuarios WHERE username = ?', 
            [username]
        );

        // 2. Si el arreglo viene vacío, el usuario no existe
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El usuario ingresado no existe.'
            });
        }

        const user = rows[0];

        // 3. Si el usuario existe, verificamos si la contraseña coincide
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'La contraseña es incorrecta.'
            });
        }

        // 4. Todo correcto, enviamos los datos (sin enviar la contraseña de vuelta por seguridad)
        return res.json({
            success: true,
            message: '¡Login correcto!',
            user: {
                id: user.id,
                username: user.username,
                nombre: user.nombre,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Error en el controlador de Login:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// 🎟️ 2. NUEVA FUNCIÓN: GENERAR TOKEN DE INVITACIÓN (Solo para ti, el entrenador)
exports.generateInvitation = async (req, res) => {
    try {
        // Genera un texto aleatorio de 16 caracteres (ej: 8f2a9b...)
        const token = crypto.randomBytes(8).toString('hex');
        
        // Lo guardamos en la nueva tabla
        await db.query('INSERT INTO invitaciones (token) VALUES (?)', [token]);

        res.json({
            success: true,
            message: 'Token generado con éxito',
            token: token,
            link_invitacion: `http://localhost:5173/registro?token=${token}` // Este es el link que le enviarás por WhatsApp
        });
    } catch (error) {
        console.error('Error generando token:', error);
        res.status(500).json({ success: false, message: 'Error interno.' });
    }
};

// 📝 3. FUNCIÓN DE REGISTRO (Actualizada para exigir un Token)
exports.register = async (req, res) => {
    const { username, password, nombre, token } = req.body; // Ahora pedimos el token

    try {
        // A. Verificamos si el token existe y no ha sido usado
        const [tokenRows] = await db.query('SELECT id FROM invitaciones WHERE token = ? AND usado = FALSE', [token]);
        if (tokenRows.length === 0) {
            return res.status(403).json({ success: false, message: 'El enlace de invitación es inválido o ya expiró.' });
        }

        // B. Verificamos si el usuario ya existe
        const [existingUser] = await db.query('SELECT id FROM usuarios WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'El nombre de usuario ya está en uso.' });
        }

        // C. Encriptamos clave y guardamos al nuevo Alumno
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Forzamos que el rol sea 'client' (alumno) para evitar que alguien se registre como entrenador
        await db.query(
            'INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)', 
            [username, hashedPassword, nombre, 'client']
        );

        // D. "Quemamos" el token para que nadie más pueda usarlo
        await db.query('UPDATE invitaciones SET usado = TRUE WHERE token = ?', [token]);

        res.json({
            success: true,
            message: '¡Cuenta de alumno creada exitosamente!'
        });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};