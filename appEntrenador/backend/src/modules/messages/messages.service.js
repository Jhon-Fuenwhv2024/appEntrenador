const db = require('../../config/db');
const { createHttpError } = require('../../middleware/auth');
const sseManager = require('./sseManager');

const MAX_CONTENT_LENGTH = 4000;
const DEFAULT_AVATAR_MARKERS = new Set(['', 'default_avatar.png', 'null', 'undefined']);

function getPushService() {
  return require('../push/push.service').pushService;
}

function normalizeFotoUrl(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed || DEFAULT_AVATAR_MARKERS.has(trimmed)) return null;
  return trimmed;
}

function mapPartner(row, { isOnline = false } = {}) {
  return {
    id: Number(row.id),
    nombre: row.nombre,
    username: row.username,
    rol: row.rol,
    foto_url: normalizeFotoUrl(row.foto_url),
    is_online: Boolean(isOnline),
  };
}

function mapMessageRow(row) {
  return {
    id: Number(row.id),
    sender_id: Number(row.sender_id),
    receiver_id: Number(row.receiver_id),
    content: row.content,
    is_read: Boolean(row.is_read),
    created_at: row.created_at,
  };
}

/**
 * Validates that actor may chat with partnerId (trainer↔client ownership).
 * Returns the partner user row (includes foto_url when available).
 */
async function assertCanMessage(actor, partnerId) {
  const partnerUserId = Number(partnerId);

  if (!Number.isInteger(partnerUserId) || partnerUserId <= 0) {
    throw createHttpError('Destinatario inválido.', 400);
  }

  if (Number(actor.id) === partnerUserId) {
    throw createHttpError('No puedes enviarte mensajes a ti mismo.', 400);
  }

  const [partnerRows] = await db.query(
    `SELECT
       u.id,
       u.nombre,
       u.username,
       u.rol,
       u.trainer_id,
       COALESCE(ti.foto_url, ai.foto_url) AS foto_url
     FROM usuarios u
     LEFT JOIN trainers_info ti ON ti.user_id = u.id AND u.rol = 'trainer'
     LEFT JOIN alumnos_info ai ON ai.user_id = u.id AND u.rol = 'client'
     WHERE u.id = ?
     LIMIT 1`,
    [partnerUserId],
  );

  if (partnerRows.length === 0) {
    throw createHttpError('Usuario no encontrado.', 404);
  }

  const partner = partnerRows[0];

  if (actor.rol === 'client') {
    const [selfRows] = await db.query(
      'SELECT trainer_id FROM usuarios WHERE id = ? AND rol = ? LIMIT 1',
      [actor.id, 'client'],
    );
    const myTrainerId = selfRows[0]?.trainer_id;

    if (
      partner.rol !== 'trainer'
      || myTrainerId == null
      || Number(myTrainerId) !== Number(partner.id)
    ) {
      throw createHttpError('Solo puedes chatear con tu entrenador asignado.', 403);
    }

    return partner;
  }

  if (actor.rol === 'trainer') {
    if (partner.rol !== 'client' || Number(partner.trainer_id) !== Number(actor.id)) {
      throw createHttpError('Solo puedes chatear con alumnos de tu cuenta.', 403);
    }
    return partner;
  }

  throw createHttpError('No tienes permiso para esta acción.', 403);
}

/**
 * Client: assigned trainer. Trainer: not used (inbox uses /clients).
 */
async function getDefaultPartner(actor) {
  if (actor.rol !== 'client') {
    throw createHttpError('Este endpoint es solo para clientes.', 403);
  }

  const [rows] = await db.query(
    `SELECT t.id, t.nombre, t.username, t.rol, ti.foto_url
     FROM usuarios c
     INNER JOIN usuarios t ON t.id = c.trainer_id AND t.rol = 'trainer'
     LEFT JOIN trainers_info ti ON ti.user_id = t.id
     WHERE c.id = ? AND c.rol = 'client'
     LIMIT 1`,
    [actor.id],
  );

  if (rows.length === 0) {
    throw createHttpError('No tienes un entrenador asignado.', 404);
  }

  const partner = rows[0];
  return mapPartner(partner, { isOnline: sseManager.isOnline(partner.id) });
}

async function getConversation(actor, partnerId) {
  const partner = await assertCanMessage(actor, partnerId);
  const me = Number(actor.id);
  const other = Number(partner.id);

  await db.query(
    `UPDATE messages
     SET is_read = TRUE
     WHERE receiver_id = ?
       AND sender_id = ?
       AND is_read = FALSE`,
    [me, other],
  );

  const [rows] = await db.query(
    `SELECT id, sender_id, receiver_id, content, is_read, created_at
     FROM messages
     WHERE (sender_id = ? AND receiver_id = ?)
        OR (sender_id = ? AND receiver_id = ?)
     ORDER BY created_at ASC, id ASC`,
    [me, other, other, me],
  );

  return {
    partner: mapPartner(partner, { isOnline: sseManager.isOnline(other) }),
    messages: rows.map(mapMessageRow),
  };
}

/**
 * True presence: partner currently has an open SSE connection (chat stream).
 */
async function getPartnerPresence(actor, partnerId) {
  const partner = await assertCanMessage(actor, partnerId);
  return {
    partnerId: Number(partner.id),
    isOnline: sseManager.isOnline(partner.id),
  };
}

async function sendMessage(actor, { receiverId, content }) {
  const rawContent = typeof content === 'string' ? content.trim() : '';

  if (!rawContent) {
    throw createHttpError('El mensaje no puede estar vacío.', 400);
  }

  if (rawContent.length > MAX_CONTENT_LENGTH) {
    throw createHttpError(`El mensaje no puede superar ${MAX_CONTENT_LENGTH} caracteres.`, 400);
  }

  const partner = await assertCanMessage(actor, receiverId);

  const [result] = await db.query(
    `INSERT INTO messages (sender_id, receiver_id, content)
     VALUES (?, ?, ?)`,
    [actor.id, partner.id, rawContent],
  );

  const [rows] = await db.query(
    `SELECT id, sender_id, receiver_id, content, is_read, created_at
     FROM messages
     WHERE id = ?
     LIMIT 1`,
    [result.insertId],
  );

  const message = mapMessageRow(rows[0]);

  sseManager.sendToUser(Number(partner.id), message);

  try {
    const preview = truncatePreview(rawContent);
    const receiverIdNum = Number(partner.id);
    const actionUrl =
      partner.rol === 'trainer' ? '/trainer/messages' : '/client/messages';
    const senderName =
      typeof actor.nombre === 'string' && actor.nombre.trim()
        ? actor.nombre.trim()
        : 'Trainfit';
    getPushService().notifyUserAsync(receiverIdNum, {
      title: `Mensaje de ${senderName}`,
      body: preview || 'Nuevo mensaje',
      actionUrl,
      type: 'chat_message',
    });
  } catch (error) {
    console.warn('[messages] push fan-out:', error.message);
  }

  return message;
}

const PREVIEW_MAX_CHARS = 80;

function truncatePreview(content) {
  const text = typeof content === 'string' ? content.trim() : '';
  if (!text) return '';
  if (text.length <= PREVIEW_MAX_CHARS) return text;
  return `${text.slice(0, PREVIEW_MAX_CHARS - 1)}…`;
}

/**
 * Unread DMs for the authenticated user (receiver_id = me, is_read = FALSE).
 * Client: 0–1 partner (assigned trainer). Trainer: N owned clients.
 */
async function getUnreadSummary(actor) {
  const me = Number(actor.id);

  if (!['trainer', 'client'].includes(actor.rol)) {
    throw createHttpError('No tienes permiso para esta acción.', 403);
  }

  let rows;

  if (actor.rol === 'client') {
    const [selfRows] = await db.query(
      'SELECT trainer_id FROM usuarios WHERE id = ? AND rol = ? LIMIT 1',
      [me, 'client'],
    );
    const trainerId = selfRows[0]?.trainer_id;

    if (trainerId == null) {
      return { total: 0, byPartner: [] };
    }

    const [result] = await db.query(
      `SELECT
         m.sender_id AS partnerId,
         COUNT(*) AS unreadCount,
         MAX(m.created_at) AS lastMessageAt,
         (
           SELECT m2.content
           FROM messages m2
           WHERE m2.receiver_id = ?
             AND m2.sender_id = m.sender_id
             AND m2.is_read = FALSE
           ORDER BY m2.created_at DESC, m2.id DESC
           LIMIT 1
         ) AS preview
       FROM messages m
       WHERE m.receiver_id = ?
         AND m.is_read = FALSE
         AND m.sender_id = ?
       GROUP BY m.sender_id
       ORDER BY lastMessageAt DESC`,
      [me, me, Number(trainerId)],
    );
    rows = result;
  } else {
    const [result] = await db.query(
      `SELECT
         m.sender_id AS partnerId,
         COUNT(*) AS unreadCount,
         MAX(m.created_at) AS lastMessageAt,
         (
           SELECT m2.content
           FROM messages m2
           WHERE m2.receiver_id = ?
             AND m2.sender_id = m.sender_id
             AND m2.is_read = FALSE
           ORDER BY m2.created_at DESC, m2.id DESC
           LIMIT 1
         ) AS preview
       FROM messages m
       INNER JOIN usuarios u
         ON u.id = m.sender_id
         AND u.rol = 'client'
         AND u.trainer_id = ?
       WHERE m.receiver_id = ?
         AND m.is_read = FALSE
       GROUP BY m.sender_id
       ORDER BY lastMessageAt DESC`,
      [me, me, me],
    );
    rows = result;
  }

  const byPartner = rows.map((row) => ({
    partnerId: Number(row.partnerId),
    count: Number(row.unreadCount) || 0,
    lastMessageAt: row.lastMessageAt,
    preview: truncatePreview(row.preview),
  }));

  const total = byPartner.reduce((sum, item) => sum + item.count, 0);

  return { total, byPartner };
}

module.exports = {
  getDefaultPartner,
  getConversation,
  getPartnerPresence,
  sendMessage,
  getUnreadSummary,
  assertCanMessage,
};
