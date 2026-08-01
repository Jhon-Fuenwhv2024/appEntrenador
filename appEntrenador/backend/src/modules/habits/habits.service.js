const db = require('../../config/db');
const clientsService = require('../clients/clients.service');
const { assertClientWritableUnderPlan } = require('../../shared/saas/trainerSeats');

const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Valida fecha civil YYYY-MM-DD sin convertir a Date/UTC.
 * Evita desfases por zona horaria al parsear timestamps.
 */
function parseLocalDateString(value, fieldLabel = 'date') {
  if (value == null || value === '') {
    throw createHttpError(`${fieldLabel} es obligatorio (YYYY-MM-DD).`, 400);
  }

  const raw = String(value).trim();
  if (!LOCAL_DATE_RE.test(raw)) {
    throw createHttpError(`${fieldLabel} debe tener formato YYYY-MM-DD.`, 400);
  }

  const [y, m, d] = raw.split('-').map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y
    || probe.getUTCMonth() !== m - 1
    || probe.getUTCDate() !== d
  ) {
    throw createHttpError(`${fieldLabel} no es una fecha válida.`, 400);
  }

  return raw;
}

function parsePositiveId(value, fieldLabel) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError(`${fieldLabel} inválido.`, 400);
  }
  return id;
}

function normalizeTitle(title) {
  if (typeof title !== 'string') {
    throw createHttpError('title es obligatorio.', 400);
  }
  const trimmed = title.trim();
  if (!trimmed) {
    throw createHttpError('title no puede estar vacío.', 400);
  }
  if (trimmed.length > 255) {
    throw createHttpError('title no puede superar 255 caracteres.', 400);
  }
  return trimmed;
}

function mapHabitRow(row) {
  return {
    id: Number(row.id),
    client_id: Number(row.client_id),
    trainer_id: Number(row.trainer_id),
    title: row.title,
    created_at: row.created_at,
  };
}

/**
 * GET /api/habits/client/:clientId — solo trainer dueño.
 */
async function listByClientForTrainer(trainerId, clientId) {
  const id = parsePositiveId(clientId, 'clientId');
  await clientsService.getClientOwnedByTrainer(id, trainerId);

  const [rows] = await db.query(
    `SELECT id, client_id, trainer_id, title, created_at
     FROM habits
     WHERE client_id = ?
     ORDER BY created_at ASC, id ASC`,
    [id],
  );

  return rows.map(mapHabitRow);
}

/**
 * POST /api/habits/client/:clientId — solo trainer dueño.
 */
async function createForTrainer(trainerId, clientId, payload) {
  const id = parsePositiveId(clientId, 'clientId');
  await clientsService.getClientOwnedByTrainer(id, trainerId);
  await assertClientWritableUnderPlan(trainerId, id);
  const title = normalizeTitle(payload?.title);

  const [result] = await db.query(
    `INSERT INTO habits (client_id, trainer_id, title)
     VALUES (?, ?, ?)`,
    [id, trainerId, title],
  );

  const [rows] = await db.query(
    `SELECT id, client_id, trainer_id, title, created_at
     FROM habits
     WHERE id = ?
     LIMIT 1`,
    [result.insertId],
  );

  return mapHabitRow(rows[0]);
}

/**
 * DELETE /api/habits/:id — solo trainer dueño del hábito.
 */
async function deleteForTrainer(trainerId, habitId) {
  const id = parsePositiveId(habitId, 'id');

  const [rows] = await db.query(
    `SELECT id, client_id, trainer_id
     FROM habits
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  if (rows.length === 0) {
    throw createHttpError('Hábito no encontrado.', 404);
  }

  const habit = rows[0];
  if (Number(habit.trainer_id) !== Number(trainerId)) {
    throw createHttpError('No puedes eliminar hábitos de otro entrenador.', 403);
  }

  await clientsService.getClientOwnedByTrainer(habit.client_id, trainerId);
  await assertClientWritableUnderPlan(trainerId, habit.client_id);

  await db.query('DELETE FROM habits WHERE id = ?', [id]);

  return { id };
}

/**
 * GET /api/habits/today?date=YYYY-MM-DD — cliente autenticado.
 * is_completed según existencia de habit_logs (comparación por DATE civil).
 */
async function listTodayForClient(clientId, dateParam) {
  const date = parseLocalDateString(dateParam, 'date');

  const [rows] = await db.query(
    `SELECT
       h.id,
       h.title,
       CASE WHEN hl.id IS NOT NULL THEN 1 ELSE 0 END AS is_completed
     FROM habits h
     LEFT JOIN habit_logs hl
       ON hl.habit_id = h.id AND DATE(hl.logged_date) = ?
     WHERE h.client_id = ?
     ORDER BY h.created_at ASC, h.id ASC`,
    [date, clientId],
  );

  return rows.map((row) => ({
    id: Number(row.id),
    title: row.title,
    is_completed: Boolean(Number(row.is_completed)),
  }));
}

/**
 * POST /api/habits/:id/toggle — cliente autenticado.
 * Body: { date: "YYYY-MM-DD", completed?: boolean }
 * - Si `completed` viene: fuerza ese estado (idempotente).
 * - Si no: toggle clásico.
 * Compara logged_date con DATE() para evitar fallos de coerción TiDB/MySQL.
 */
async function toggleForClient(clientId, habitId, dateParam, completedParam) {
  const id = parsePositiveId(habitId, 'id');
  const date = parseLocalDateString(dateParam, 'date');
  const wantCompleted = typeof completedParam === 'boolean' ? completedParam : null;

  const [habits] = await db.query(
    `SELECT id, client_id
     FROM habits
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  if (habits.length === 0) {
    throw createHttpError('Hábito no encontrado.', 404);
  }

  if (Number(habits[0].client_id) !== Number(clientId)) {
    throw createHttpError('No puedes modificar hábitos de otro usuario.', 403);
  }

  const [existing] = await db.query(
    `SELECT id
     FROM habit_logs
     WHERE habit_id = ?
       AND DATE(logged_date) = ?
     LIMIT 1`,
    [id, date],
  );

  const isCompleted = existing.length > 0;
  const shouldComplete = wantCompleted === null ? !isCompleted : wantCompleted;

  if (!shouldComplete) {
    if (isCompleted) {
      await db.query('DELETE FROM habit_logs WHERE id = ?', [Number(existing[0].id)]);
    } else {
      // Por si existe con coerción distinta: borrar por fecha civil.
      await db.query(
        `DELETE FROM habit_logs
         WHERE habit_id = ?
           AND DATE(logged_date) = ?`,
        [id, date],
      );
    }
    return { completed: false, date };
  }

  if (!isCompleted) {
    try {
      await db.query(
        `INSERT INTO habit_logs (habit_id, logged_date)
         VALUES (?, ?)`,
        [id, date],
      );
    } catch (error) {
      if (error?.code !== 'ER_DUP_ENTRY' && Number(error?.errno) !== 1062) {
        throw error;
      }
      // Ya existía: queda marcado.
    }
  }

  return { completed: true, date };
}

module.exports = {
  listByClientForTrainer,
  createForTrainer,
  deleteForTrainer,
  listTodayForClient,
  toggleForClient,
  parseLocalDateString,
};
