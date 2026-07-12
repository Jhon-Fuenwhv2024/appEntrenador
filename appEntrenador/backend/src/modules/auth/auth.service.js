const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');

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
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
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

  const safeUser = {
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    rol: user.rol,
  };

  return {
    user: safeUser,
    token: signToken(safeUser),
  };
}

async function generateInvitation(trainerId) {
  if (!trainerId) {
    throw createHttpError('Trainer no autenticado.', 401);
  }

  const token = crypto.randomBytes(8).toString('hex');

  await db.query(
    'INSERT INTO invitaciones (token, trainer_id) VALUES (?, ?)',
    [token, trainerId],
  );

  return {
    token,
    link_invitacion: `http://localhost:5173/registro?token=${token}`,
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

    const [invites] = await connection.query(
      'SELECT id, trainer_id FROM invitaciones WHERE token = ? AND usado = FALSE FOR UPDATE',
      [invitationToken],
    );

    if (invites.length === 0) {
      throw createHttpError('El enlace de invitación es inválido o ya fue utilizado.', 403);
    }

    const invite = invites[0];

    if (!invite.trainer_id) {
      throw createHttpError(
        'Esta invitación no está vinculada a un entrenador. Solicita un enlace nuevo.',
        403,
      );
    }

    const [consumeResult] = await connection.query(
      'UPDATE invitaciones SET usado = TRUE WHERE id = ? AND usado = FALSE',
      [invite.id],
    );

    if (consumeResult.affectedRows !== 1) {
      throw createHttpError('El enlace de invitación es inválido o ya fue utilizado.', 403);
    }

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
  generateInvitation,
  register,
};
