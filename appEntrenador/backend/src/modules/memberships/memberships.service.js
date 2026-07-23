const db = require('../../config/db');

const VALID_STATUSES = new Set(['active', 'owing', 'expired']);

/** Lazy require — evita ciclo memberships ↔ clients (module.exports replace). */
function getClientsService() {
  return require('../clients/clients.service');
}

function getTrainerSeats() {
  return require('../../shared/saas/trainerSeats');
}

const SELECT_COLUMNS = `
  cm.id,
  cm.client_id,
  cm.status,
  DATE_FORMAT(cm.period_start, '%Y-%m-%d') AS period_start,
  DATE_FORMAT(cm.period_end, '%Y-%m-%d') AS period_end,
  cm.notes,
  cm.block_on_unpaid,
  cm.updated_by,
  cm.updated_at,
  DATEDIFF(cm.period_end, CURDATE()) AS days_remaining
`;

function createHttpError(message, code, errorKey) {
  const error = new Error(message);
  error.code = code;
  if (errorKey) {
    error.error = errorKey;
  }
  return error;
}

/** Fechas civiles YYYY-MM-DD sin desfase TZ (MySQL DATE / Date UTC). */
function toDateOnly(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(value).trim();
  // Evita "2026-07-17T00:00:00.000Z" → usar solo la parte fecha.
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  return null;
}

function todayDateOnly() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Plan mensual (~30 días): fin = día anterior al mismo día del mes siguiente.
 * Ej. 2026-07-17 → 2026-08-16. Aritmética UTC para evitar bugs de TZ.
 */
function monthlyPeriodEnd(dateOnly) {
  const [y, m, d] = dateOnly.split('-').map(Number);
  let ny = y;
  let nm = m + 1;
  if (nm > 12) {
    nm = 1;
    ny += 1;
  }
  const lastDayNext = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  const anniversary = Math.min(d, lastDayNext);
  const end = new Date(Date.UTC(ny, nm - 1, anniversary));
  end.setUTCDate(end.getUTCDate() - 1);
  const yy = end.getUTCFullYear();
  const mm = String(end.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(end.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function daysBetween(startDateOnly, endDateOnly) {
  if (!startDateOnly || !endDateOnly) return null;
  const [ys, ms, ds] = startDateOnly.split('-').map(Number);
  const [ye, me, de] = endDateOnly.split('-').map(Number);
  const start = Date.UTC(ys, ms - 1, ds);
  const end = Date.UTC(ye, me - 1, de);
  return Math.round((end - start) / 86400000);
}

function mapMembershipRow(row, { includeNotes = true } = {}) {
  if (!row) return null;

  const periodStart = toDateOnly(row.period_start);
  // Siempre normalizar fin al ciclo de 30 días (corrige filas guardadas con regla antigua).
  const periodEnd = periodStart
    ? monthlyPeriodEnd(periodStart)
    : toDateOnly(row.period_end);

  const daysRemaining = periodEnd
    ? daysBetween(todayDateOnly(), periodEnd)
    : (row.days_remaining == null ? null : Number(row.days_remaining));

  const payload = {
    client_id: Number(row.client_id),
    status: row.status,
    period_start: periodStart,
    period_end: periodEnd,
    days_remaining: Number.isFinite(daysRemaining) ? daysRemaining : null,
    block_on_unpaid: Boolean(row.block_on_unpaid),
    updated_by: row.updated_by == null ? null : Number(row.updated_by),
    updated_at: row.updated_at ?? null,
  };

  if (includeNotes) {
    payload.notes = row.notes ?? null;
  }

  return payload;
}

async function getByClientId(clientId) {
  const [rows] = await db.query(
    `SELECT ${SELECT_COLUMNS}
     FROM client_memberships cm
     WHERE cm.client_id = ?
     LIMIT 1`,
    [clientId],
  );
  const row = rows[0] || null;
  if (!row) return null;

  const start = toDateOnly(row.period_start);
  if (!start) return row;

  const correctEnd = monthlyPeriodEnd(start);
  const storedEnd = toDateOnly(row.period_end);
  if (correctEnd && storedEnd !== correctEnd) {
    await db.query(
      `UPDATE client_memberships
       SET period_end = ?
       WHERE client_id = ?`,
      [correctEnd, clientId],
    );
    row.period_end = correctEnd;
    row.days_remaining = daysBetween(todayDateOnly(), correctEnd);
  }

  return row;
}

/**
 * Trainer dueño: membresía completa (incluye notes).
 */
async function getForTrainer(trainerId, clientId) {
  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw createHttpError('clientId inválido.', 400);
  }

  await getClientsService().getClientOwnedByTrainer(clientId, trainerId);
  const row = await getByClientId(clientId);
  return mapMembershipRow(row, { includeNotes: true });
}

/**
 * Cliente autenticado: sin notes internas.
 */
async function getForClient(clientId) {
  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw createHttpError('clientId inválido.', 400);
  }

  const row = await getByClientId(clientId);
  if (!row) return null;

  const mapped = mapMembershipRow(row, { includeNotes: false });
  return {
    status: mapped.status,
    period_start: mapped.period_start,
    period_end: mapped.period_end,
    days_remaining: mapped.days_remaining,
    block_on_unpaid: mapped.block_on_unpaid,
  };
}

function parseOptionalDate(value, fieldLabel) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const dateOnly = toDateOnly(value);
  if (!dateOnly) {
    throw createHttpError(`${fieldLabel} debe ser una fecha YYYY-MM-DD.`, 400);
  }
  return dateOnly;
}

function normalizeUpsertPayload(payload) {
  const body = payload || {};

  if (body.status === undefined || body.status === null || body.status === '') {
    throw createHttpError('status es obligatorio.', 400);
  }

  const status = String(body.status).trim().toLowerCase();
  if (!VALID_STATUSES.has(status)) {
    throw createHttpError('status debe ser active, owing o expired.', 400);
  }

  const periodStart = parseOptionalDate(body.period_start, 'period_start');
  if (!periodStart) {
    throw createHttpError('period_start es obligatorio (inicio del mes de membresía).', 400);
  }

  // Plan único mensual: el vencimiento se calcula; se ignora period_end del cliente.
  const periodEnd = monthlyPeriodEnd(periodStart);

  let nextStatus = status;
  if (periodEnd < todayDateOnly() && nextStatus === 'active') {
    nextStatus = 'expired';
  }

  let notes = null;
  if (body.notes !== undefined && body.notes !== null) {
    notes = String(body.notes).trim();
    if (notes.length === 0) notes = null;
  }

  const blockOnUnpaid = body.block_on_unpaid === true
    || body.block_on_unpaid === 1
    || body.block_on_unpaid === '1'
    || body.block_on_unpaid === 'true';

  return {
    status: nextStatus,
    period_start: periodStart,
    period_end: periodEnd,
    notes,
    block_on_unpaid: blockOnUnpaid,
  };
}

/**
 * Upsert membresía (solo trainer dueño).
 */
async function upsertForTrainer(trainerId, clientId, payload) {
  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw createHttpError('clientId inválido.', 400);
  }

  await getClientsService().getClientOwnedByTrainer(clientId, trainerId);
  await getTrainerSeats().assertClientWritableUnderPlan(trainerId, clientId);
  const data = normalizeUpsertPayload(payload);

  await db.query(
    `INSERT INTO client_memberships (
      client_id, status, period_start, period_end, notes, block_on_unpaid, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      period_start = VALUES(period_start),
      period_end = VALUES(period_end),
      notes = VALUES(notes),
      block_on_unpaid = VALUES(block_on_unpaid),
      updated_by = VALUES(updated_by)`,
    [
      clientId,
      data.status,
      data.period_start,
      data.period_end,
      data.notes,
      data.block_on_unpaid ? 1 : 0,
      trainerId,
    ],
  );

  return getForTrainer(trainerId, clientId);
}

/**
 * Soft-lock: bloquea rutinas / workout si el trainer activó bloqueo
 * y la membresía no está al día.
 */
async function assertClientMembershipAccess(clientId) {
  const row = await getByClientId(clientId);
  if (!row) return;

  const membership = mapMembershipRow(row, { includeNotes: false });
  if (!membership.block_on_unpaid) return;

  const daysRemaining = membership.days_remaining;
  const notActive = membership.status !== 'active';
  const expiredByDate = daysRemaining != null && daysRemaining < 0;

  if (notActive || expiredByDate) {
    throw createHttpError(
      'Tu membresía venció — habla con tu entrenador.',
      403,
      'MEMBERSHIP_BLOCKED',
    );
  }
}

/**
 * Resumen ligero para lista de alumnos / overview.
 */
function summarizeMembership(row) {
  if (!row) return null;
  return mapMembershipRow(row, { includeNotes: false });
}

module.exports = {
  getForTrainer,
  getForClient,
  upsertForTrainer,
  assertClientMembershipAccess,
  getByClientId,
  summarizeMembership,
  mapMembershipRow,
  monthlyPeriodEnd,
  toDateOnly,
  createHttpError,
};
