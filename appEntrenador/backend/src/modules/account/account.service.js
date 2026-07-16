const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');

const DEFAULT_AVATAR_MARKERS = new Set(['', 'default_avatar.png', 'null', 'undefined']);

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeFotoUrl(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed || DEFAULT_AVATAR_MARKERS.has(trimmed)) return null;
  return trimmed;
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

function resolveAvatarPublicUrl(file) {
  if (!file?.filename) return null;
  return `/uploads/avatars/${file.filename}`;
}

async function loadUserRow(userId) {
  const [rows] = await db.query(
    `SELECT id, username, nombre, rol, is_superadmin
     FROM usuarios
     WHERE id = ?
     LIMIT 1`,
    [userId],
  );
  if (rows.length === 0) {
    throw createHttpError('Usuario no encontrado.', 404);
  }
  return rows[0];
}

async function getMyAccount(userId) {
  const user = await loadUserRow(userId);
  const base = {
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    rol: user.rol,
    is_superadmin: Boolean(user.is_superadmin),
    telefono: null,
    foto_url: null,
  };

  if (user.rol === 'trainer') {
    const [info] = await db.query(
      `SELECT telefono, foto_url
       FROM trainers_info
       WHERE user_id = ?
       LIMIT 1`,
      [userId],
    );
    if (info[0]) {
      base.telefono = info[0].telefono || null;
      base.foto_url = normalizeFotoUrl(info[0].foto_url);
    }
  } else if (user.rol === 'client') {
    const [info] = await db.query(
      `SELECT telefono, foto_url
       FROM alumnos_info
       WHERE user_id = ?
       LIMIT 1`,
      [userId],
    );
    if (info[0]) {
      base.telefono = info[0].telefono || null;
      base.foto_url = normalizeFotoUrl(info[0].foto_url);
    }
  }

  return base;
}

async function updateMyAccount(userId, body = {}, uploadedFile = null) {
  const user = await loadUserRow(userId);
  const nombreRaw = body.nombre != null ? String(body.nombre).trim() : undefined;
  const telefonoRaw = body.telefono != null ? String(body.telefono).trim() : undefined;
  const fotoUrl = uploadedFile ? resolveAvatarPublicUrl(uploadedFile) : undefined;

  if (nombreRaw !== undefined) {
    if (!nombreRaw) {
      throw createHttpError('El nombre es obligatorio.', 400);
    }
    if (nombreRaw.length > 100) {
      throw createHttpError('El nombre no puede superar 100 caracteres.', 400);
    }
  }

  if (telefonoRaw !== undefined && telefonoRaw.length > 20) {
    throw createHttpError('El teléfono no puede superar 20 caracteres.', 400);
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (nombreRaw !== undefined) {
      await connection.query(
        'UPDATE usuarios SET nombre = ? WHERE id = ?',
        [nombreRaw, userId],
      );
    }

    if (user.rol === 'trainer' && (telefonoRaw !== undefined || fotoUrl !== undefined)) {
      const [existing] = await connection.query(
        'SELECT id, telefono, foto_url FROM trainers_info WHERE user_id = ? LIMIT 1 FOR UPDATE',
        [userId],
      );

      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO trainers_info (user_id, telefono, foto_url)
           VALUES (?, ?, ?)`,
          [
            userId,
            telefonoRaw !== undefined ? (telefonoRaw || null) : null,
            fotoUrl !== undefined ? fotoUrl : null,
          ],
        );
      } else {
        await connection.query(
          `UPDATE trainers_info
           SET telefono = ?, foto_url = ?
           WHERE user_id = ?`,
          [
            telefonoRaw !== undefined ? (telefonoRaw || null) : existing[0].telefono,
            fotoUrl !== undefined ? fotoUrl : existing[0].foto_url,
            userId,
          ],
        );
      }
    }

    if (user.rol === 'client' && (telefonoRaw !== undefined || fotoUrl !== undefined)) {
      const [existing] = await connection.query(
        'SELECT id, telefono, foto_url FROM alumnos_info WHERE user_id = ? LIMIT 1 FOR UPDATE',
        [userId],
      );

      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO alumnos_info (user_id, telefono, foto_url)
           VALUES (?, ?, ?)`,
          [
            userId,
            telefonoRaw !== undefined ? (telefonoRaw || null) : null,
            fotoUrl !== undefined ? fotoUrl : null,
          ],
        );
      } else {
        await connection.query(
          `UPDATE alumnos_info
           SET telefono = ?, foto_url = ?
           WHERE user_id = ?`,
          [
            telefonoRaw !== undefined ? (telefonoRaw || null) : existing[0].telefono,
            fotoUrl !== undefined ? fotoUrl : existing[0].foto_url,
            userId,
          ],
        );
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const account = await getMyAccount(userId);
  return {
    account,
    token: signToken({
      id: account.id,
      username: account.username,
      nombre: account.nombre,
      rol: account.rol,
      is_superadmin: account.is_superadmin,
    }),
  };
}

async function changeMyPassword(userId, { current_password, new_password }) {
  const currentPassword = typeof current_password === 'string' ? current_password : '';
  const newPassword = typeof new_password === 'string' ? new_password : '';

  if (!currentPassword || !newPassword) {
    throw createHttpError('Debes indicar la contraseña actual y la nueva.', 400);
  }
  if (newPassword.length < 6) {
    throw createHttpError('La nueva contraseña debe tener al menos 6 caracteres.', 400);
  }
  if (currentPassword === newPassword) {
    throw createHttpError('La nueva contraseña debe ser distinta a la actual.', 400);
  }

  const [rows] = await db.query(
    'SELECT id, password FROM usuarios WHERE id = ? LIMIT 1',
    [userId],
  );
  if (rows.length === 0) {
    throw createHttpError('Usuario no encontrado.', 404);
  }

  const valid = await bcrypt.compare(currentPassword, rows[0].password);
  if (!valid) {
    throw createHttpError('La contraseña actual es incorrecta.', 401);
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashed, userId]);

  return { changed: true };
}

module.exports = {
  getMyAccount,
  updateMyAccount,
  changeMyPassword,
};
