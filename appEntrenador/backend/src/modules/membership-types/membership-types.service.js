const db = require('../../config/db');

function createHttpError(message, code, errorKey) {
  const error = new Error(message);
  error.code = code;
  if (errorKey) error.error = errorKey;
  return error;
}

function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

function mapTypeRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    trainer_id: Number(row.trainer_id),
    name: row.name,
    price: Number(row.price),
    duration_days: Number(row.duration_days) || 30,
    is_active: Boolean(row.is_active),
    sort_order: Number(row.sort_order) || 0,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

function parsePrice(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw createHttpError('price debe ser un número ≥ 0.', 400);
  }
  return Math.round(n * 100) / 100;
}

function parseDurationDays(raw) {
  const n = Number(raw == null || raw === '' ? 30 : raw);
  if (!Number.isInteger(n) || n < 1 || n > 3660) {
    throw createHttpError('duration_days debe ser un entero entre 1 y 3660.', 400);
  }
  return n;
}

async function listForTrainer(trainerId, { includeInactive = false } = {}) {
  const params = [trainerId];
  let sql = `
    SELECT id, trainer_id, name, price, duration_days, is_active, sort_order, created_at, updated_at
    FROM trainer_membership_types
    WHERE trainer_id = ?
  `;
  if (!includeInactive) {
    sql += ' AND is_active = 1';
  }
  sql += ' ORDER BY sort_order ASC, name ASC, id ASC';

  const [rows] = await db.query(sql, params);
  return rows.map(mapTypeRow);
}

async function getOwnedByTrainer(trainerId, typeId) {
  const id = Number(typeId);
  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError('id de tipo inválido.', 400);
  }
  const [rows] = await db.query(
    `SELECT id, trainer_id, name, price, duration_days, is_active, sort_order, created_at, updated_at
     FROM trainer_membership_types
     WHERE id = ? AND trainer_id = ?
     LIMIT 1`,
    [id, trainerId],
  );
  const row = rows[0] || null;
  if (!row) {
    throw createHttpError('Tipo de membresía no encontrado.', 404);
  }
  return mapTypeRow(row);
}

async function assertNameUnique(trainerId, name, excludeId = null) {
  const normalized = normalizeName(name).toLowerCase();
  const [rows] = await db.query(
    `SELECT id, name FROM trainer_membership_types WHERE trainer_id = ?`,
    [trainerId],
  );
  const clash = rows.find((r) => {
    if (excludeId != null && Number(r.id) === Number(excludeId)) return false;
    return String(r.name || '').trim().toLowerCase() === normalized;
  });
  if (clash) {
    throw createHttpError('Ya tienes un tipo con ese nombre.', 409, 'DUPLICATE_NAME');
  }
}

async function createForTrainer(trainerId, payload) {
  const name = normalizeName(payload?.name);
  if (!name || name.length > 120) {
    throw createHttpError('name es obligatorio (máx. 120 caracteres).', 400);
  }
  await assertNameUnique(trainerId, name);
  const price = parsePrice(payload?.price);
  const durationDays = parseDurationDays(payload?.duration_days);
  const sortOrder = Number.isFinite(Number(payload?.sort_order))
    ? Math.round(Number(payload.sort_order))
    : 0;

  const [result] = await db.query(
    `INSERT INTO trainer_membership_types
      (trainer_id, name, price, duration_days, is_active, sort_order)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [trainerId, name, price, durationDays, sortOrder],
  );

  return getOwnedByTrainer(trainerId, result.insertId);
}

async function updateForTrainer(trainerId, typeId, payload) {
  const existing = await getOwnedByTrainer(trainerId, typeId);
  const body = payload || {};

  let name = existing.name;
  if (body.name !== undefined) {
    name = normalizeName(body.name);
    if (!name || name.length > 120) {
      throw createHttpError('name es obligatorio (máx. 120 caracteres).', 400);
    }
    await assertNameUnique(trainerId, name, existing.id);
  }

  let price = existing.price;
  if (body.price !== undefined) {
    price = parsePrice(body.price);
  }

  let durationDays = existing.duration_days;
  if (body.duration_days !== undefined) {
    durationDays = parseDurationDays(body.duration_days);
  }

  let isActive = existing.is_active;
  if (body.is_active !== undefined) {
    isActive = body.is_active === true
      || body.is_active === 1
      || body.is_active === '1'
      || body.is_active === 'true';
  }

  let sortOrder = existing.sort_order;
  if (body.sort_order !== undefined && Number.isFinite(Number(body.sort_order))) {
    sortOrder = Math.round(Number(body.sort_order));
  }

  await db.query(
    `UPDATE trainer_membership_types
     SET name = ?, price = ?, duration_days = ?, is_active = ?, sort_order = ?
     WHERE id = ? AND trainer_id = ?`,
    [name, price, durationDays, isActive ? 1 : 0, sortOrder, existing.id, trainerId],
  );

  return getOwnedByTrainer(trainerId, existing.id);
}

async function countAssignments(typeId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM client_memberships WHERE membership_type_id = ?`,
    [typeId],
  );
  return Number(rows[0]?.cnt) || 0;
}

async function removeForTrainer(trainerId, typeId) {
  const existing = await getOwnedByTrainer(trainerId, typeId);
  const used = await countAssignments(existing.id);

  if (used > 0) {
    await db.query(
      `UPDATE trainer_membership_types SET is_active = 0 WHERE id = ? AND trainer_id = ?`,
      [existing.id, trainerId],
    );
    return { archived: true, id: existing.id };
  }

  await db.query(
    `DELETE FROM trainer_membership_types WHERE id = ? AND trainer_id = ?`,
    [existing.id, trainerId],
  );
  return { deleted: true, id: existing.id };
}

module.exports = {
  listForTrainer,
  getOwnedByTrainer,
  createForTrainer,
  updateForTrainer,
  removeForTrainer,
  mapTypeRow,
};
