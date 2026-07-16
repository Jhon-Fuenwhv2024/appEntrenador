const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');
const invitesService = require('../invites/invites.service');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
      is_superadmin: Boolean(user.is_superadmin),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

async function login({ username, password }) {
  const [rows] = await db.query(
    'SELECT id, username, nombre, rol, is_superadmin, password FROM usuarios WHERE username = ?',
    [username],
  );

  if (rows.length === 0) {
    throw createHttpError('El usuario ingresado no existe.', 404);
  }

  const user = rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw createHttpError('La contraseña es incorrecta.', 401);
  }

  const safeUser = {
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    rol: user.rol,
    is_superadmin: Boolean(user.is_superadmin),
  };

  return {
    user: safeUser,
    token: signToken(safeUser),
  };
}

async function register({ username, password, nombre, token }) {
  const invitationToken = typeof token === 'string' ? token.trim() : '';

  if (!invitationToken) {
    throw createHttpError('Falta el token de invitación.', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const invite = await invitesService.validateAndConsumeToken(
      invitationToken,
      connection,
    );

    const [existingUser] = await connection.query(
      'SELECT id FROM usuarios WHERE username = ?',
      [username],
    );

    if (existingUser.length > 0) {
      throw createHttpError('El nombre de usuario ya está en uso.', 400);
    }

    await connection.query(
      'INSERT INTO usuarios (username, password, nombre, rol, trainer_id) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, nombre, 'client', invite.trainer_id],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  login,
  register,
};
