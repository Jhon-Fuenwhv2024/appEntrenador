const db = require('../../config/db');
const clientsService = require('../clients/clients.service');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeExerciseName(name) {
  return String(name || '').trim().toLowerCase();
}

function mapPrRow(row) {
  return {
    id: row.id,
    client_id: row.client_id,
    exercise_id: row.exercise_id,
    exercise_name: row.exercise_name,
    weight: Number(row.weight),
    reps: row.reps,
    achieved_at: row.achieved_at,
    session_id: row.session_id,
    set_log_id: row.set_log_id,
    created_at: row.created_at,
  };
}

/**
 * Best set per exercise in the session (max weight; tie → higher reps).
 * Match key: normalized exercise_name (exercise_id en logs es línea de rutina, no estable).
 */
function pickBestSetsByExercise(sets) {
  const bestByKey = new Map();

  for (const set of sets) {
    const key = normalizeExerciseName(set.exercise_name);
    if (!key) continue;
    const weight = Number(set.weight);
    const reps = Number(set.reps);
    if (Number.isNaN(weight) || weight < 0) continue;

    const prev = bestByKey.get(key);
    if (
      !prev
      || weight > prev.weight
      || (weight === prev.weight && reps > prev.reps)
    ) {
      bestByKey.set(key, {
        exercise_id: set.exercise_id ?? null,
        exercise_name: set.exercise_name,
        weight,
        reps,
        set_log_id: set.id ?? null,
      });
    }
  }

  return bestByKey;
}

async function getHistoricalMaxWeight(clientId, exerciseName, excludeSessionId) {
  const nameKey = normalizeExerciseName(exerciseName);

  const [prRows] = await db.query(
    `SELECT MAX(weight) AS max_weight
     FROM personal_records
     WHERE client_id = ? AND LOWER(TRIM(exercise_name)) = ?`,
    [clientId, nameKey],
  );
  let maxWeight = prRows[0]?.max_weight != null ? Number(prRows[0].max_weight) : null;

  const [logRows] = await db.query(
    `SELECT MAX(l.weight) AS max_weight
     FROM workout_set_logs l
     INNER JOIN workout_sessions s ON s.id = l.session_id
     WHERE s.client_id = ?
       AND s.status = 'completed'
       AND LOWER(TRIM(l.exercise_name)) = ?
       AND s.id <> ?`,
    [clientId, nameKey, excludeSessionId],
  );
  const logMax = logRows[0]?.max_weight != null ? Number(logRows[0].max_weight) : null;

  if (logMax != null && (maxWeight == null || logMax > maxWeight)) {
    maxWeight = logMax;
  }

  return maxWeight;
}

/**
 * Detecta PRs de peso tras cerrar sesión completed. Inserta filas y retorna new_prs.
 */
async function detectAndSavePrsForSession(clientId, session) {
  if (!session || session.status !== 'completed') {
    return [];
  }

  const sets = Array.isArray(session.sets) ? session.sets : [];
  if (sets.length === 0) return [];

  const bestByKey = pickBestSetsByExercise(sets);
  const newPrs = [];

  for (const [, best] of bestByKey) {
    if (best.weight <= 0) continue;

    const priorMax = await getHistoricalMaxWeight(clientId, best.exercise_name, session.id);
    if (priorMax != null && best.weight <= priorMax) {
      continue;
    }

    const [result] = await db.query(
      `INSERT INTO personal_records
        (client_id, exercise_id, exercise_name, weight, reps, achieved_at, session_id, set_log_id)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, NOW()), ?, ?)`,
      [
        clientId,
        best.exercise_id,
        best.exercise_name,
        best.weight,
        best.reps,
        session.finished_at || null,
        session.id,
        best.set_log_id,
      ],
    );

    newPrs.push({
      id: result.insertId,
      client_id: clientId,
      exercise_id: best.exercise_id,
      exercise_name: best.exercise_name,
      weight: best.weight,
      reps: best.reps,
      achieved_at: session.finished_at || new Date().toISOString(),
      session_id: session.id,
      set_log_id: best.set_log_id,
      previous_max: priorMax,
    });
  }

  return newPrs;
}

async function listForClient(clientId) {
  const [rows] = await db.query(
    `SELECT id, client_id, exercise_id, exercise_name, weight, reps,
            achieved_at, session_id, set_log_id, created_at
     FROM personal_records
     WHERE client_id = ?
     ORDER BY achieved_at DESC, id DESC
     LIMIT 100`,
    [clientId],
  );
  return rows.map(mapPrRow);
}

async function listMine(clientId) {
  return listForClient(clientId);
}

async function listForClientAsTrainer(trainerId, clientId) {
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
  return listForClient(clientId);
}

async function countPrsThisMonth(clientId) {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM personal_records
     WHERE client_id = ?
       AND achieved_at >= DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-01')`,
    [clientId],
  );
  return Number(row?.cnt) || 0;
}

module.exports = {
  detectAndSavePrsForSession,
  listMine,
  listForClientAsTrainer,
  countPrsThisMonth,
  createHttpError,
};
