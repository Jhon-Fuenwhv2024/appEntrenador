const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  APP_PUBLIC_URL,
} = require('../../config/env');
const invitesService = require('../invites/invites.service');
const { sendMail, isSmtpConfigured } = require('../../shared/mail/mailer');

const GENERIC_FORGOT_MESSAGE =
  'Si la cuenta existe y tiene un correo registrado, te hemos enviado un enlace para restablecer tu contraseña.';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DURATION_RE = /^(\d+)(ms|s|m|h|d)$/i;
const UNIT_MS = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function toBool(value) {
  return value === true || value === 1 || value === '1';
}

function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function isValidEmail(email) {
  return Boolean(email) && email.length <= 255 && EMAIL_RE.test(email);
}

function hashOpaqueToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashResetToken(token) {
  return hashOpaqueToken(token);
}

function parseDurationMs(value, fallbackMs) {
  if (typeof value !== 'string' || !value.trim()) return fallbackMs;
  const match = value.trim().match(DURATION_RE);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return amount * UNIT_MS[unit];
}

function refreshExpiresAt() {
  const ms = parseDurationMs(REFRESH_TOKEN_EXPIRES_IN, 30 * UNIT_MS.d);
  return new Date(Date.now() + ms);
}

function truncateUserAgent(userAgent) {
  if (typeof userAgent !== 'string') return null;
  const trimmed = userAgent.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 512);
}

function toSafeUser(row) {
  return {
    id: row.id,
    username: row.username,
    nombre: row.nombre,
    rol: row.rol,
    is_superadmin: toBool(row.is_superadmin),
  };
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
      is_superadmin: user.is_superadmin === true,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

/**
 * Inserts a new refresh token row. Returns the raw token (never store raw).
 */
async function issueRefreshToken(userId, { userAgent, connection } = {}) {
  const raw = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashOpaqueToken(raw);
  const expiresAt = refreshExpiresAt();
  const ua = truncateUserAgent(userAgent);
  const executor = connection || db;

  const [result] = await executor.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent)
     VALUES (?, ?, ?, ?)`,
    [userId, tokenHash, expiresAt, ua],
  );

  return {
    refreshToken: raw,
    refreshTokenId: result.insertId,
  };
}

async function revokeAllRefreshTokensForUser(userId, connection) {
  const executor = connection || db;
  await executor.query(
    `UPDATE refresh_tokens
     SET revoked_at = COALESCE(revoked_at, NOW())
     WHERE user_id = ?
       AND revoked_at IS NULL`,
    [userId],
  );
}

async function buildAuthSession(user, { userAgent } = {}) {
  const safeUser = toSafeUser(user);
  const { refreshToken } = await issueRefreshToken(safeUser.id, { userAgent });
  return {
    user: safeUser,
    token: signToken(safeUser),
    refreshToken,
  };
}

async function login({ username, password }, meta = {}) {
  const [rows] = await db.query(
    'SELECT id, username, nombre, rol, password, is_superadmin FROM usuarios WHERE username = ?',
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

  return buildAuthSession(user, meta);
}

async function register({ username, password, nombre, email, token }) {
  const invitationToken = typeof token === 'string' ? token.trim() : '';
  const normalizedEmail = normalizeEmail(email);

  if (!invitationToken) {
    throw createHttpError('Falta el token de invitación.', 400);
  }

  if (!isValidEmail(normalizedEmail)) {
    throw createHttpError('Debes indicar un correo electrónico válido.', 400);
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

    const [existingEmail] = await connection.query(
      'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
      [normalizedEmail],
    );

    if (existingEmail.length > 0) {
      throw createHttpError('El correo electrónico ya está en uso.', 400);
    }

    await connection.query(
      `INSERT INTO usuarios (username, password, nombre, email, rol, trainer_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, nombre, normalizedEmail, 'client', invite.trainer_id],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Rotate refresh token: validate → issue new pair → mark old as revoked/replaced.
 * Concurrent refresh from another tab (recently rotated parent) gets a grace
 * re-issue instead of nuking the whole session family.
 */
async function refreshSession({ refreshToken, userAgent }) {
  const raw = typeof refreshToken === 'string' ? refreshToken.trim() : '';
  if (!raw) {
    throw createHttpError('Refresh token requerido.', 400);
  }

  const tokenHash = hashOpaqueToken(raw);
  const connection = await db.getConnection();
  /** Overlap window for multi-tab / visibility races (ms). */
  const ROTATION_GRACE_MS = 60_000;

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, user_id, expires_at, revoked_at, replaced_by_id, last_used_at, created_at
       FROM refresh_tokens
       WHERE token_hash = ?
       LIMIT 1
       FOR UPDATE`,
      [tokenHash],
    );

    if (rows.length === 0) {
      throw createHttpError('Sesión inválida o expirada.', 401);
    }

    const row = rows[0];

    if (row.revoked_at || row.replaced_by_id) {
      const rotatedAt = row.last_used_at || row.revoked_at || row.created_at;
      const rotatedMs = rotatedAt ? new Date(rotatedAt).getTime() : 0;
      const withinGrace = rotatedMs > 0
        && (Date.now() - rotatedMs) <= ROTATION_GRACE_MS;

      if (withinGrace && row.user_id) {
        const [users] = await connection.query(
          `SELECT id, username, nombre, rol, is_superadmin
           FROM usuarios
           WHERE id = ?
           LIMIT 1`,
          [row.user_id],
        );
        if (users.length) {
          const safeUser = toSafeUser(users[0]);
          const { refreshToken: nextRefresh } = await issueRefreshToken(
            safeUser.id,
            { userAgent, connection },
          );
          await connection.commit();
          return {
            user: safeUser,
            token: signToken(safeUser),
            refreshToken: nextRefresh,
          };
        }
      }

      await revokeAllRefreshTokensForUser(row.user_id, connection);
      await connection.commit();
      throw createHttpError('Sesión inválida o expirada.', 401);
    }

    if (new Date(row.expires_at).getTime() <= Date.now()) {
      await connection.query(
        `UPDATE refresh_tokens
         SET revoked_at = COALESCE(revoked_at, NOW())
         WHERE id = ?`,
        [row.id],
      );
      await connection.commit();
      throw createHttpError('Sesión inválida o expirada.', 401);
    }

    const [users] = await connection.query(
      `SELECT id, username, nombre, rol, is_superadmin
       FROM usuarios
       WHERE id = ?
       LIMIT 1`,
      [row.user_id],
    );

    if (users.length === 0) {
      await revokeAllRefreshTokensForUser(row.user_id, connection);
      await connection.commit();
      throw createHttpError('Sesión inválida o expirada.', 401);
    }

    const safeUser = toSafeUser(users[0]);
    const { refreshToken: nextRefresh, refreshTokenId } = await issueRefreshToken(
      safeUser.id,
      { userAgent, connection },
    );

    await connection.query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW(),
           replaced_by_id = ?,
           last_used_at = NOW()
       WHERE id = ?`,
      [refreshTokenId, row.id],
    );

    await connection.commit();

    return {
      user: safeUser,
      token: signToken(safeUser),
      refreshToken: nextRefresh,
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // ignore rollback errors after commit/failed begin
    }
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Logout: revoke by Bearer user and/or by presented refresh token.
 */
async function logout({ userId, refreshToken }) {
  const raw = typeof refreshToken === 'string' ? refreshToken.trim() : '';

  if (userId) {
    await revokeAllRefreshTokensForUser(userId);
    return { revoked: true };
  }

  if (!raw) {
    return { revoked: false };
  }

  const tokenHash = hashOpaqueToken(raw);
  const [rows] = await db.query(
    `SELECT user_id FROM refresh_tokens WHERE token_hash = ? LIMIT 1`,
    [tokenHash],
  );

  if (rows.length === 0) {
    return { revoked: false };
  }

  await revokeAllRefreshTokensForUser(rows[0].user_id);
  return { revoked: true };
}

/**
 * Lookup by username (preferred) or email. Always returns the same generic payload
 * (no user enumeration). Resolves the registered email on the server.
 */
async function forgotPassword({ username, email }) {
  const result = { message: GENERIC_FORGOT_MESSAGE };
  const usernameRaw = typeof username === 'string' ? username.trim() : '';
  const normalizedEmail = normalizeEmail(email);

  let rows = [];

  if (usernameRaw) {
    const [byUser] = await db.query(
      'SELECT id, email, nombre, username FROM usuarios WHERE username = ? LIMIT 1',
      [usernameRaw],
    );
    rows = byUser;
  } else if (isValidEmail(normalizedEmail)) {
    const [byEmail] = await db.query(
      'SELECT id, email, nombre, username FROM usuarios WHERE email = ? LIMIT 1',
      [normalizedEmail],
    );
    rows = byEmail;
  } else {
    return result;
  }

  if (rows.length === 0) {
    return result;
  }

  const user = rows[0];
  if (!user.email || !isValidEmail(normalizeEmail(user.email))) {
    console.warn(
      '[auth] Forgot-password: usuario sin email registrado (id=%s).',
      user.id,
    );
    return result;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await db.query(
    `UPDATE usuarios
     SET reset_password_token = ?, reset_password_expires = ?
     WHERE id = ?`,
    [tokenHash, expires, user.id],
  );

  const resetUrl = `${APP_PUBLIC_URL}/reset-password?token=${rawToken}`;
  const subject = 'Restablecer contraseña — Trainfit';
  const text = [
    `Hola${user.nombre ? ` ${user.nombre}` : ''},`,
    '',
    'Recibimos una solicitud para restablecer tu contraseña en Trainfit.',
    'Abre este enlace (válido 1 hora):',
    resetUrl,
    '',
    'Si no solicitaste este cambio, ignora este correo.',
  ].join('\n');

  try {
    await sendMail({
      to: user.email,
      subject,
      text,
      html: `<p>Hola${user.nombre ? ` ${user.nombre}` : ''},</p>
<p>Recibimos una solicitud para restablecer tu contraseña en Trainfit.</p>
<p><a href="${resetUrl}">Restablecer contraseña</a></p>
<p>El enlace es válido durante 1 hora. Si no solicitaste este cambio, ignora este correo.</p>`,
    });
  } catch (error) {
    console.error('[auth] No se pudo enviar email de reset:', error.message || error);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[auth] Enlace de desarrollo para reset (no compartir / no usar en prod):',
        resetUrl,
      );
      if (!isSmtpConfigured()) {
        console.warn('[auth] SMTP no configurado. Completa SMTP_* en backend/.env');
      }
    }
  }

  return result;
}

async function resetPassword({ token, password }) {
  const rawToken = typeof token === 'string' ? token.trim() : '';
  const newPassword = typeof password === 'string' ? password : '';

  if (!rawToken || !newPassword) {
    throw createHttpError('Token y nueva contraseña son obligatorios.', 400);
  }

  if (newPassword.length < 6) {
    throw createHttpError('La nueva contraseña debe tener al menos 6 caracteres.', 400);
  }

  const tokenHash = hashResetToken(rawToken);
  const [rows] = await db.query(
    `SELECT id FROM usuarios
     WHERE reset_password_token = ?
       AND reset_password_expires IS NOT NULL
       AND reset_password_expires > NOW()
     LIMIT 1`,
    [tokenHash],
  );

  if (rows.length === 0) {
    throw createHttpError('El enlace no es válido o ha expirado.', 400);
  }

  const userId = rows[0].id;
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.query(
    `UPDATE usuarios
     SET password = ?, reset_password_token = NULL, reset_password_expires = NULL
     WHERE id = ?`,
    [hashed, userId],
  );

  await revokeAllRefreshTokensForUser(userId);

  return { changed: true };
}

module.exports = {
  login,
  register,
  refreshSession,
  logout,
  forgotPassword,
  resetPassword,
  GENERIC_FORGOT_MESSAGE,
};
