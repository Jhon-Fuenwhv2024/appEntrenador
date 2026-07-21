const db = require('../../config/db');
const clientsService = require('../clients/clients.service');
const membershipsService = require('../memberships/memberships.service');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeSets(sets) {
  if (!Array.isArray(sets) || sets.length === 0) {
    throw createHttpError('Debes incluir al menos una serie registrada.', 400);
  }

  return sets.map((item, index) => {
    const exerciseName = typeof item.exercise_name === 'string'
      ? item.exercise_name.trim()
      : '';
    const setNumber = Number(item.set_number);
    const weight = Number(item.weight);
    const reps = Math.round(Number(item.reps));
    const exerciseIdRaw = item.exercise_id;
    const exerciseId = exerciseIdRaw == null || exerciseIdRaw === ''
      ? null
      : Number(exerciseIdRaw);

    if (!exerciseName) {
      throw createHttpError(`La serie #${index + 1} necesita el nombre del ejercicio.`, 400);
    }
    if (!Number.isInteger(setNumber) || setNumber < 1) {
      throw createHttpError(`Número de serie inválido en "${exerciseName}".`, 400);
    }
    if (Number.isNaN(weight) || weight < 0) {
      throw createHttpError(`Peso inválido en "${exerciseName}" serie ${setNumber}.`, 400);
    }
    if (Number.isNaN(reps) || reps < 1) {
      throw createHttpError(`Repeticiones inválidas en "${exerciseName}" serie ${setNumber}.`, 400);
    }
    if (exerciseId != null && (!Number.isInteger(exerciseId) || exerciseId < 1)) {
      throw createHttpError(`exercise_id inválido en "${exerciseName}".`, 400);
    }

    return {
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      set_number: setNumber,
      weight,
      reps,
    };
  });
}

async function assertRoutineBelongsToClient(routineId, clientId) {
  const [rows] = await db.query(
    'SELECT id, nombre_rutina FROM rutinas WHERE id = ? AND alumno_id = ? LIMIT 1',
    [routineId, clientId],
  );
  if (rows.length === 0) {
    throw createHttpError('La rutina no pertenece a tu cuenta.', 403);
  }
  return rows[0];
}

async function createMySession(clientId, payload) {
  await membershipsService.assertClientMembershipAccess(clientId);

  const routineId = Number(payload.routine_id);
  if (!Number.isInteger(routineId) || routineId < 1) {
    throw createHttpError('routine_id es obligatorio.', 400);
  }

  const routine = await assertRoutineBelongsToClient(routineId, clientId);
  const routineName = typeof payload.routine_name === 'string' && payload.routine_name.trim()
    ? payload.routine_name.trim()
    : routine.nombre_rutina;

  const status = payload.status === 'abandoned' ? 'abandoned' : 'completed';
  const sets = normalizeSets(payload.sets);

  let startedAt = null;
  if (payload.started_at) {
    const parsed = new Date(payload.started_at);
    if (Number.isNaN(parsed.getTime())) {
      throw createHttpError('started_at inválido.', 400);
    }
    startedAt = parsed;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [sessionResult] = await connection.query(
      `INSERT INTO workout_sessions
        (client_id, routine_id, routine_name, started_at, finished_at, status)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [clientId, routineId, routineName, startedAt, status],
    );

    const sessionId = sessionResult.insertId;

    for (const set of sets) {
      let exerciseId = set.exercise_id;
      if (exerciseId != null) {
        const [owned] = await connection.query(
          `SELECT e.id
           FROM ejercicios e
           INNER JOIN rutinas r ON r.id = e.rutina_id
           WHERE e.id = ? AND r.alumno_id = ?
           LIMIT 1`,
          [exerciseId, clientId],
        );
        if (owned.length === 0) {
          exerciseId = null;
        }
      }

      await connection.query(
        `INSERT INTO workout_set_logs
          (session_id, exercise_id, exercise_name, set_number, weight, reps)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          exerciseId,
          set.exercise_name,
          set.set_number,
          set.weight,
          set.reps,
        ],
      );
    }

    await connection.commit();
    return getSessionByIdForClient(sessionId, clientId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getSessionByIdForClient(sessionId, clientId) {
  const [sessions] = await db.query(
    `SELECT id, client_id, routine_id, routine_name, started_at, finished_at, status, created_at
     FROM workout_sessions
     WHERE id = ? AND client_id = ?
     LIMIT 1`,
    [sessionId, clientId],
  );
  if (sessions.length === 0) {
    throw createHttpError('Sesión no encontrada.', 404);
  }
  const [sets] = await db.query(
    `SELECT id, exercise_id, exercise_name, set_number, weight, reps, created_at
     FROM workout_set_logs
     WHERE session_id = ?
     ORDER BY id ASC`,
    [sessionId],
  );
  return mapSession(sessions[0], sets);
}

function mapSession(session, sets) {
  return {
    id: session.id,
    client_id: session.client_id,
    routine_id: session.routine_id,
    routine_name: session.routine_name,
    started_at: session.started_at,
    finished_at: session.finished_at,
    status: session.status,
    created_at: session.created_at,
    sets: sets.map((row) => ({
      id: row.id,
      exercise_id: row.exercise_id,
      exercise_name: row.exercise_name,
      set_number: row.set_number,
      weight: Number(row.weight),
      reps: row.reps,
      created_at: row.created_at,
    })),
  };
}

async function listSessionsForClient(clientId, options = {}) {
  const limitRaw = Number(options.limit);
  const offsetRaw = Number(options.offset);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(Math.trunc(limitRaw), 1), 50)
    : 8;
  const offset = Number.isFinite(offsetRaw) && offsetRaw > 0
    ? Math.trunc(offsetRaw)
    : 0;

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM workout_sessions
     WHERE client_id = ?`,
    [clientId],
  );
  const total = Number(countRows[0]?.total) || 0;

  const [sessions] = await db.query(
    `SELECT id, client_id, routine_id, routine_name, started_at, finished_at, status, created_at
     FROM workout_sessions
     WHERE client_id = ?
     ORDER BY finished_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [clientId, limit, offset],
  );

  if (sessions.length === 0) {
    return {
      sessions: [],
      hasMore: false,
      total,
      limit,
      offset,
    };
  }

  const sessionIds = sessions.map((s) => s.id);
  const placeholders = sessionIds.map(() => '?').join(',');
  const [sets] = await db.query(
    `SELECT id, session_id, exercise_id, exercise_name, set_number, weight, reps, created_at
     FROM workout_set_logs
     WHERE session_id IN (${placeholders})
     ORDER BY id ASC`,
    sessionIds,
  );

  const bySession = new Map();
  for (const set of sets) {
    const list = bySession.get(set.session_id) || [];
    list.push(set);
    bySession.set(set.session_id, list);
  }

  const mapped = sessions.map((session) => mapSession(session, bySession.get(session.id) || []));
  const hasMore = offset + mapped.length < total;

  return {
    sessions: mapped,
    hasMore,
    total,
    limit,
    offset,
  };
}

/** Client portal: only sessions owned by req.user.id. Returns array (compat 021). */
async function listMySessions(clientId) {
  const result = await listSessionsForClient(clientId, { limit: 50, offset: 0 });
  return result.sessions;
}

async function listSessionsForClientAsTrainer(trainerId, clientId, options = {}) {
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
  return listSessionsForClient(clientId, options);
}

module.exports = {
  createMySession,
  listMySessions,
  listSessionsForClientAsTrainer,
};
