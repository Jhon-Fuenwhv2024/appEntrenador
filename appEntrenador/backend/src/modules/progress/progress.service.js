const db = require('../../config/db');
const clientsService = require('../clients/clients.service');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Trainer: solo alumnos propios. Client: solo su propio id.
 */
async function assertCanAccessClient(user, clientId) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError('clientId inválido.', 400);
  }

  if (user.rol === 'client') {
    if (Number(user.id) !== id) {
      throw createHttpError('No puedes consultar el progreso de otro usuario.', 403);
    }
    return id;
  }

  if (user.rol === 'trainer') {
    await clientsService.getClientOwnedByTrainer(id, user.id);
    return id;
  }

  throw createHttpError('No tienes permiso para esta acción.', 403);
}

function toIsoDate(value) {
  if (value == null) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  return raw;
}

/**
 * Evolución corporal: peso e IMC ordenados ASC para eje X cronológico.
 * @returns {{ labels: string[], weightKg: number[], bmi: (number|null)[] }}
 */
async function getMetricsProgress(user, clientId) {
  const id = await assertCanAccessClient(user, clientId);

  const [rows] = await db.query(
    `SELECT measured_at, weight_kg, bmi
     FROM body_composition_logs
     WHERE client_id = ?
     ORDER BY measured_at ASC, id ASC`,
    [id],
  );

  const labels = [];
  const weightKg = [];
  const bmi = [];

  for (const row of rows) {
    labels.push(toIsoDate(row.measured_at));
    weightKg.push(row.weight_kg == null ? null : Number(row.weight_kg));
    bmi.push(row.bmi == null ? null : Number(row.bmi));
  }

  return { labels, weightKg, bmi };
}

/**
 * Lista ejercicios distintos con al menos un set logueado (para el selector).
 */
async function listLoggedExercises(user, clientId) {
  const id = await assertCanAccessClient(user, clientId);

  const [rows] = await db.query(
    `SELECT
       wsl.exercise_name AS exerciseName,
       MIN(wsl.exercise_id) AS exerciseId,
       COUNT(*) AS setCount
     FROM workout_set_logs wsl
     INNER JOIN workout_sessions ws ON ws.id = wsl.session_id
     WHERE ws.client_id = ?
     GROUP BY wsl.exercise_name
     ORDER BY wsl.exercise_name ASC`,
    [id],
  );

  return rows.map((row) => ({
    exerciseId: row.exerciseId == null ? null : Number(row.exerciseId),
    exerciseName: row.exerciseName,
    setCount: Number(row.setCount) || 0,
  }));
}

async function resolveExerciseName(clientId, exerciseId, exerciseName) {
  const nameFromQuery = typeof exerciseName === 'string' ? exerciseName.trim() : '';
  if (nameFromQuery) {
    return nameFromQuery;
  }

  const id = Number(exerciseId);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError('Debes indicar exerciseId (o exerciseName) del ejercicio a graficar.', 400);
  }

  // Preferir nombre asociado a ese exercise_id (línea de rutina).
  // Si el id ya no existe en logs, 404.
  const [byId] = await db.query(
    `SELECT wsl.exercise_name AS exerciseName
     FROM workout_set_logs wsl
     INNER JOIN workout_sessions ws ON ws.id = wsl.session_id
     WHERE ws.client_id = ? AND wsl.exercise_id = ?
     LIMIT 1`,
    [clientId, id],
  );

  if (byId.length > 0) {
    return byId[0].exerciseName;
  }

  throw createHttpError('No hay logs para ese ejercicio.', 404);
}

/**
 * Evolución de fuerza: MAX(weight) por día para un ejercicio.
 * Agrupa por exercise_name (estable en el tiempo; exercise_id de ejercicios es efímero).
 * @returns {{ exerciseName: string, labels: string[], maxWeight: number[] }}
 */
async function getExerciseProgress(user, clientId, { exerciseId, exerciseName } = {}) {
  const id = await assertCanAccessClient(user, clientId);
  const name = await resolveExerciseName(id, exerciseId, exerciseName);

  const [rows] = await db.query(
    `SELECT
       DATE(ws.finished_at) AS logDate,
       MAX(wsl.weight) AS maxWeight
     FROM workout_set_logs wsl
     INNER JOIN workout_sessions ws ON ws.id = wsl.session_id
     WHERE ws.client_id = ?
       AND wsl.exercise_name = ?
     GROUP BY DATE(ws.finished_at)
     ORDER BY logDate ASC`,
    [id, name],
  );

  const labels = [];
  const maxWeight = [];

  for (const row of rows) {
    labels.push(toIsoDate(row.logDate));
    maxWeight.push(row.maxWeight == null ? null : Number(row.maxWeight));
  }

  return {
    exerciseName: name,
    labels,
    maxWeight,
  };
}

module.exports = {
  assertCanAccessClient,
  getMetricsProgress,
  listLoggedExercises,
  getExerciseProgress,
};
