const db = require('../../config/db');
const { createHttpError } = require('../../middleware/auth');
const sseManager = require('./sseManager');

const MAX_CONTENT_LENGTH = 4000;

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
 * Returns the partner user row.
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
    `SELECT id, nombre, username, rol, trainer_id
     FROM usuarios
     WHERE id = ?
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
    `SELECT t.id, t.nombre, t.username, t.rol
     FROM usuarios c
     INNER JOIN usuarios t ON t.id = c.trainer_id AND t.rol = 'trainer'
     WHERE c.id = ? AND c.rol = 'client'
     LIMIT 1`,
    [actor.id],
  );

  if (rows.length === 0) {
    throw createHttpError('No tienes un entrenador asignado.', 404);
  }

  return {
    id: Number(rows[0].id),
    nombre: rows[0].nombre,
    username: rows[0].username,
    rol: rows[0].rol,
  };
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
    partner: {
      id: Number(partner.id),
      nombre: partner.nombre,
      username: partner.username,
      rol: partner.rol,
    },
    messages: rows.map(mapMessageRow),
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

  sseManager.sendToUser(partner.id, message);

  return message;
}

module.exports = {
  getDefaultPartner,
  getConversation,
  sendMessage,
  assertCanMessage,
};
