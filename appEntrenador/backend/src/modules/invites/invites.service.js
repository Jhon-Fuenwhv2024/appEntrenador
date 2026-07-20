const crypto = require('crypto');
const db = require('../../config/db');
const { APP_PUBLIC_URL, NODE_ENV } = require('../../config/env');

const LOCAL_APP_URL = 'http://localhost:5173';

const INVITE_STATUSES = Object.freeze({
  PENDING: 'pending',
  USED: 'used',
  REVOKED: 'revoked',
});

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/** Local → Vite; producción → APP_PUBLIC_URL (Workers / dominio público). */
function resolveInviteBaseUrl() {
  if (NODE_ENV !== 'production') {
    return LOCAL_APP_URL;
  }
  return APP_PUBLIC_URL || LOCAL_APP_URL;
}

function buildInviteLink(token) {
  return `${resolveInviteBaseUrl()}/registro?token=${encodeURIComponent(token)}`;
}

function mapInviteRow(row) {
  return {
    id: row.id,
    token: row.token,
    status: row.status,
    trainer_id: row.trainer_id,
    fecha_creacion: row.fecha_creacion,
    link_invitacion: buildInviteLink(row.token),
  };
}

async function createInvite(trainerId) {
  if (!trainerId) {
    throw createHttpError('Trainer no autenticado.', 401);
  }

  const token = crypto.randomBytes(8).toString('hex');

  const [result] = await db.query(
    'INSERT INTO invitaciones (token, status, trainer_id) VALUES (?, ?, ?)',
    [token, INVITE_STATUSES.PENDING, trainerId],
  );

  const [rows] = await db.query(
    'SELECT id, token, status, trainer_id, fecha_creacion FROM invitaciones WHERE id = ?',
    [result.insertId],
  );

  const invite = mapInviteRow(rows[0]);

  return {
    id: invite.id,
    token: invite.token,
    status: invite.status,
    fecha_creacion: invite.fecha_creacion,
    link_invitacion: invite.link_invitacion,
  };
}

async function listInvites(trainerId) {
  if (!trainerId) {
    throw createHttpError('Trainer no autenticado.', 401);
  }

  const [rows] = await db.query(
    `SELECT id, token, status, trainer_id, fecha_creacion
     FROM invitaciones
     WHERE trainer_id = ?
     ORDER BY fecha_creacion DESC`,
    [trainerId],
  );

  return rows.map(mapInviteRow);
}

async function revokeInvite(inviteId, trainerId) {
  if (!trainerId) {
    throw createHttpError('Trainer no autenticado.', 401);
  }

  const id = Number(inviteId);

  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError('ID de invitación inválido.', 400);
  }

  const [rows] = await db.query(
    'SELECT id, status, trainer_id FROM invitaciones WHERE id = ?',
    [id],
  );

  if (rows.length === 0 || rows[0].trainer_id !== trainerId) {
    throw createHttpError('Invitación no encontrada.', 404);
  }

  if (rows[0].status !== INVITE_STATUSES.PENDING) {
    throw createHttpError('Solo se pueden revocar invitaciones pendientes.', 400);
  }

  const [updateResult] = await db.query(
    `UPDATE invitaciones
     SET status = ?
     WHERE id = ? AND trainer_id = ? AND status = ?`,
    [INVITE_STATUSES.REVOKED, id, trainerId, INVITE_STATUSES.PENDING],
  );

  if (updateResult.affectedRows !== 1) {
    throw createHttpError('Solo se pueden revocar invitaciones pendientes.', 400);
  }

  return {
    id,
    status: INVITE_STATUSES.REVOKED,
  };
}

/**
 * Validates a pending invite and marks it as used inside an existing transaction.
 * @param {string} token
 * @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<{ id: number, trainer_id: number }>}
 */
async function validateAndConsumeToken(token, connection) {
  if (!connection) {
    throw createHttpError('Se requiere una conexión transaccional.', 500);
  }

  const invitationToken = typeof token === 'string' ? token.trim() : '';

  if (!invitationToken) {
    throw createHttpError('Falta el token de invitación.', 400);
  }

  const [invites] = await connection.query(
    `SELECT id, trainer_id
     FROM invitaciones
     WHERE token = ? AND status = ?
     FOR UPDATE`,
    [invitationToken, INVITE_STATUSES.PENDING],
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
    `UPDATE invitaciones
     SET status = ?
     WHERE id = ? AND status = ?`,
    [INVITE_STATUSES.USED, invite.id, INVITE_STATUSES.PENDING],
  );

  if (consumeResult.affectedRows !== 1) {
    throw createHttpError('El enlace de invitación es inválido o ya fue utilizado.', 403);
  }

  return {
    id: invite.id,
    trainer_id: invite.trainer_id,
  };
}

module.exports = {
  INVITE_STATUSES,
  createInvite,
  listInvites,
  revokeInvite,
  validateAndConsumeToken,
};
