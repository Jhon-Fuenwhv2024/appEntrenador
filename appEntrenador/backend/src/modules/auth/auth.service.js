const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../../config/db');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function login({ username, password }) {
  const [rows] = await db.query(
    'SELECT id, username, nombre, rol, password FROM usuarios WHERE username = ?',
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

  return {
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    rol: user.rol,
  };
}

async function generateInvitation() {
  const token = crypto.randomBytes(8).toString('hex');

  await db.query('INSERT INTO invitaciones (token) VALUES (?)', [token]);

  return {
    token,
    link_invitacion: `http://localhost:5173/registro?token=${token}`,
  };
}

async function register({ username, password, nombre, token }) {
  const [tokenRows] = await db.query(
    'SELECT id FROM invitaciones WHERE token = ? AND usado = FALSE',
    [token],
  );

  if (tokenRows.length === 0) {
    throw createHttpError('El enlace de invitación es inválido o ya expiró.', 403);
  }

  const [existingUser] = await db.query('SELECT id FROM usuarios WHERE username = ?', [username]);

  if (existingUser.length > 0) {
    throw createHttpError('El nombre de usuario ya está en uso.', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.query(
    'INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)',
    [username, hashedPassword, nombre, 'client'],
  );

  await db.query('UPDATE invitaciones SET usado = TRUE WHERE token = ?', [token]);
}

module.exports = {
  login,
  generateInvitation,
  register,
};
