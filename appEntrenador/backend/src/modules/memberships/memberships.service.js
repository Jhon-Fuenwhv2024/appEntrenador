const db = require('../../config/db');

const VALID_STATUSES = new Set(['active', 'owing', 'expired']);

/** Días de acceso tras period_end antes del soft-lock (Feature 080+). */
const MEMBERSHIP_ACCESS_GRACE_DAYS = 3;

/** Lazy require — evita ciclo memberships ↔ clients (module.exports replace). */
function getClientsService() {
  return require('../clients/clients.service');
}

function getTrainerSeats() {
  return require('../../shared/saas/trainerSeats');
}

function getMembershipTypesService() {
  return require('../membership-types/membership-types.service');
}

const SELECT_COLUMNS = `
  cm.id,
  cm.client_id,
  cm.membership_type_id,
  cm.status,
  DATE_FORMAT(cm.period_start, '%Y-%m-%d') AS period_start,
  DATE_FORMAT(cm.period_end, '%Y-%m-%d') AS period_end,
  cm.notes,
  cm.plan_price,
  cm.amount_paid,
  cm.block_on_unpaid,
  cm.updated_by,
  cm.updated_at,
  DATEDIFF(cm.period_end, CURDATE()) AS days_remaining,
  tmt.name AS membership_type_name,
  tmt.duration_days AS type_duration_days
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

/** period_end = period_start + (durationDays - 1). */
function periodEndFromDuration(dateOnly, durationDays) {
  const days = Number(durationDays);
  if (!Number.isInteger(days) || days < 1) {
    return monthlyPeriodEnd(dateOnly);
  }
  const [y, m, d] = dateOnly.split('-').map(Number);
  const end = new Date(Date.UTC(y, m - 1, d));
  end.setUTCDate(end.getUTCDate() + (days - 1));
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

function toMoneyOrNull(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function computeAmountDue(planPrice, amountPaid) {
  if (planPrice == null) return null;
  const paid = amountPaid == null ? 0 : Number(amountPaid);
  const due = Math.max(0, Number(planPrice) - (Number.isFinite(paid) ? paid : 0));
  return Math.round(due * 100) / 100;
}

function mapMembershipRow(row, { includeNotes = true } = {}) {
  if (!row) return null;

  const periodStart = toDateOnly(row.period_start);
  const hasType = row.membership_type_id != null;
  const storedEnd = toDateOnly(row.period_end);
  // Con tipo: respetar period_end guardado. Sin tipo: ciclo mensual 040.
  const periodEnd = periodStart
    ? (hasType && storedEnd ? storedEnd : monthlyPeriodEnd(periodStart))
    : storedEnd;

  const daysRemaining = periodEnd
    ? daysBetween(todayDateOnly(), periodEnd)
    : (row.days_remaining == null ? null : Number(row.days_remaining));

  const planPrice = toMoneyOrNull(row.plan_price);
  const amountPaid = toMoneyOrNull(row.amount_paid) ?? 0;

  const payload = {
    client_id: Number(row.client_id),
    membership_type_id: row.membership_type_id == null ? null : Number(row.membership_type_id),
    membership_type_name: row.membership_type_name || null,
    status: row.status,
    period_start: periodStart,
    period_end: periodEnd,
    days_remaining: Number.isFinite(daysRemaining) ? daysRemaining : null,
    plan_price: planPrice,
    amount_paid: amountPaid,
    amount_due: computeAmountDue(planPrice, amountPaid),
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
     LEFT JOIN trainer_membership_types tmt ON tmt.id = cm.membership_type_id
     WHERE cm.client_id = ?
     LIMIT 1`,
    [clientId],
  );
  const row = rows[0] || null;
  if (!row) return null;

  const start = toDateOnly(row.period_start);
  if (!start) return row;

  // Solo auto-corregir ciclo mensual cuando NO hay tipo asignado.
  if (row.membership_type_id == null) {
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
  }

  // Auto-alinear status → expired si el periodo ya terminó (aunque aún haya gracia de acceso).
  const end = toDateOnly(row.period_end);
  const today = todayDateOnly();
  if (end && end < today && row.status !== 'expired') {
    await db.query(
      `UPDATE client_memberships
       SET status = 'expired'
       WHERE client_id = ? AND status <> 'expired'`,
      [clientId],
    );
    row.status = 'expired';
  }

  return row;
}

async function getForTrainer(trainerId, clientId) {
  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw createHttpError('clientId inválido.', 400);
  }

  await getClientsService().getClientOwnedByTrainer(clientId, trainerId);
  const row = await getByClientId(clientId);
  return mapMembershipRow(row, { includeNotes: true });
}

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
    membership_type_id: mapped.membership_type_id,
    membership_type_name: mapped.membership_type_name,
    plan_price: mapped.plan_price,
    amount_paid: mapped.amount_paid,
    amount_due: mapped.amount_due,
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

function parseAmountPaid(raw) {
  if (raw === undefined || raw === null || raw === '') return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw createHttpError('amount_paid debe ser un número ≥ 0.', 400);
  }
  return Math.round(n * 100) / 100;
}

function amountPaidWasOmitted(raw) {
  return raw === undefined || raw === null || raw === '';
}

/**
 * Feature 080: sincroniza status con montos y fecha cuando hay plan_price.
 * Sin plan_price solo auto-expira active → expired (flujo 040).
 */
function applyMembershipPaymentRules({
  status,
  period_end: periodEnd,
  plan_price: planPrice,
  amount_paid: amountPaid,
}) {
  const today = todayDateOnly();
  const paid = amountPaid == null ? 0 : Number(amountPaid);
  const price = planPrice == null ? null : Number(planPrice);

  if (price == null || !Number.isFinite(price)) {
    let nextStatus = status;
    if (periodEnd && periodEnd < today && nextStatus === 'active') {
      nextStatus = 'expired';
    }
    return {
      status: nextStatus,
      amount_paid: Number.isFinite(paid) ? Math.round(paid * 100) / 100 : 0,
      plan_price: null,
    };
  }

  if (!Number.isFinite(paid) || paid < 0) {
    throw createHttpError('amount_paid debe ser un número ≥ 0.', 400);
  }

  const normalizedPaid = Math.round(paid * 100) / 100;
  const normalizedPrice = Math.round(price * 100) / 100;

  if (normalizedPaid > normalizedPrice) {
    const label = normalizedPrice.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
    throw createHttpError(
      `El monto pagado no puede superar el valor del plan (${label}).`,
      400,
    );
  }

  let nextStatus;
  if (periodEnd && periodEnd < today) {
    nextStatus = 'expired';
  } else if (normalizedPaid >= normalizedPrice) {
    nextStatus = 'active';
  } else {
    nextStatus = 'owing';
  }

  return {
    status: nextStatus,
    amount_paid: normalizedPaid,
    plan_price: normalizedPrice,
  };
}

/**
 * Normaliza upsert; si hay membershipType (objeto del catálogo), usa su duration/price.
 */
function normalizeUpsertPayload(payload, membershipType = null) {
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
    throw createHttpError('period_start es obligatorio (inicio del plan de membresía).', 400);
  }

  const periodEnd = membershipType
    ? periodEndFromDuration(periodStart, membershipType.duration_days)
    : monthlyPeriodEnd(periodStart);

  let notes = null;
  if (body.notes !== undefined && body.notes !== null) {
    notes = String(body.notes).trim();
    if (notes.length === 0) notes = null;
  }

  const blockOnUnpaid = body.block_on_unpaid === true
    || body.block_on_unpaid === 1
    || body.block_on_unpaid === '1'
    || body.block_on_unpaid === 'true';

  let membershipTypeId = null;
  let planPrice = null;
  if (membershipType) {
    membershipTypeId = membershipType.id;
    planPrice = membershipType.price;
  } else if (body.membership_type_id === null || body.membership_type_id === '') {
    membershipTypeId = null;
    planPrice = null;
  }

  // Si envían plan_price explícito sin tipo, aceptar override (raro).
  if (!membershipType && body.plan_price != null && body.plan_price !== '') {
    const explicit = Number(body.plan_price);
    if (!Number.isFinite(explicit) || explicit < 0) {
      throw createHttpError('plan_price debe ser un número ≥ 0.', 400);
    }
    planPrice = Math.round(explicit * 100) / 100;
  }

  let amountPaid = parseAmountPaid(body.amount_paid);
  // Al día sin monto explícito + precio → asumir pagado completo (antes de reglas 080).
  if (
    status === 'active'
    && planPrice != null
    && amountPaidWasOmitted(body.amount_paid)
  ) {
    amountPaid = planPrice;
  }

  const ruled = applyMembershipPaymentRules({
    status,
    period_end: periodEnd,
    plan_price: planPrice,
    amount_paid: amountPaid,
  });

  return {
    status: ruled.status,
    period_start: periodStart,
    period_end: periodEnd,
    notes,
    block_on_unpaid: blockOnUnpaid,
    membership_type_id: membershipTypeId,
    plan_price: ruled.plan_price,
    amount_paid: ruled.amount_paid,
  };
}

async function upsertForTrainer(trainerId, clientId, payload) {
  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw createHttpError('clientId inválido.', 400);
  }

  await getClientsService().getClientOwnedByTrainer(clientId, trainerId);
  await getTrainerSeats().assertClientWritableUnderPlan(trainerId, clientId);

  let membershipType = null;
  const rawTypeId = payload?.membership_type_id;
  if (rawTypeId != null && rawTypeId !== '') {
    membershipType = await getMembershipTypesService().getOwnedByTrainer(trainerId, rawTypeId);
    if (!membershipType.is_active) {
      throw createHttpError('Ese tipo de membresía está archivado.', 400);
    }
  }

  const data = normalizeUpsertPayload(payload, membershipType);

  await db.query(
    `INSERT INTO client_memberships (
      client_id, membership_type_id, status, period_start, period_end,
      notes, plan_price, amount_paid, block_on_unpaid, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      membership_type_id = VALUES(membership_type_id),
      status = VALUES(status),
      period_start = VALUES(period_start),
      period_end = VALUES(period_end),
      notes = VALUES(notes),
      plan_price = VALUES(plan_price),
      amount_paid = VALUES(amount_paid),
      block_on_unpaid = VALUES(block_on_unpaid),
      updated_by = VALUES(updated_by)`,
    [
      clientId,
      data.membership_type_id,
      data.status,
      data.period_start,
      data.period_end,
      data.notes,
      data.plan_price,
      data.amount_paid,
      data.block_on_unpaid ? 1 : 0,
      trainerId,
    ],
  );

  return getForTrainer(trainerId, clientId);
}

async function assertClientMembershipAccess(clientId) {
  const row = await getByClientId(clientId);
  if (!row) return;

  const membership = mapMembershipRow(row, { includeNotes: false });
  if (!shouldBlockMembershipAccess(membership)) return;

  throw createHttpError(
    'Tu membresía venció — habla con tu entrenador.',
    403,
    'MEMBERSHIP_BLOCKED',
  );
}

/**
 * Días después de period_end (0 si el periodo sigue vigente).
 * days_remaining = DATEDIFF(period_end, hoy).
 */
function getDaysPastPeriodEnd(daysRemaining) {
  if (daysRemaining == null || daysRemaining === '') return null;
  const d = Number(daysRemaining);
  if (!Number.isFinite(d)) return null;
  if (d >= 0) return 0;
  return -d;
}

function isMembershipPastGrace(daysRemaining, graceDays = MEMBERSHIP_ACCESS_GRACE_DAYS) {
  const past = getDaysPastPeriodEnd(daysRemaining);
  if (past == null) return false;
  return past > graceDays;
}

/**
 * Soft-lock: block_on_unpaid + fuera de gracia.
 * Pendiente (owing) con periodo vigente NO bloquea.
 */
function shouldBlockMembershipAccess(membership, graceDays = MEMBERSHIP_ACCESS_GRACE_DAYS) {
  if (!membership || !membership.block_on_unpaid) return false;
  return isMembershipPastGrace(membership.days_remaining, graceDays);
}

function summarizeMembership(row) {
  if (!row) return null;
  return mapMembershipRow(row, { includeNotes: false });
}

module.exports = {
  getForTrainer,
  getForClient,
  upsertForTrainer,
  assertClientMembershipAccess,
  shouldBlockMembershipAccess,
  isMembershipPastGrace,
  MEMBERSHIP_ACCESS_GRACE_DAYS,
  getByClientId,
  summarizeMembership,
  mapMembershipRow,
  applyMembershipPaymentRules,
  monthlyPeriodEnd,
  periodEndFromDuration,
  toDateOnly,
  createHttpError,
};
