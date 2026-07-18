const db = require('../../config/db');
const clientsService = require('../clients/clients.service');
const exercisesService = require('../exercises/exercises.service');
const habitsService = require('../habits/habits.service');
const nutritionService = require('../nutrition/nutrition.service');
const membershipsService = require('../memberships/memberships.service');

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
/** Sunday-first index aligned with Date#getUTCDay(). */
const DAYS_BY_UTC_WEEKDAY = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];
/** Default rest between sets (Feature 028). */
const DEFAULT_REST_TIME_SECONDS = 90;
const MAX_REST_TIME_SECONDS = 900;

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeRestTimeSeconds(raw, nombre) {
  if (raw == null || raw === '') {
    return DEFAULT_REST_TIME_SECONDS;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > MAX_REST_TIME_SECONDS) {
    throw createHttpError(
      `Descanso inválido en el ejercicio "${nombre}" (usa 0–${MAX_REST_TIME_SECONDS} segundos).`,
      400,
    );
  }
  return Math.round(value);
}

function normalizeOptionalExerciseId(raw, index, nombre) {
  if (raw == null || raw === '') return null;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError(`exercise_id inválido en el ejercicio "${nombre}".`, 400);
  }
  return id;
}

/** Feature 029: empty → null; 1–2 chars A–Z / 0–9. Accepts plain string or { value }. */
function normalizeSupersetLetter(raw, nombre) {
  if (raw == null || raw === '') return null;
  let value = raw;
  if (typeof value === 'object') {
    value = value.value ?? value.title ?? '';
  }
  if (value == null || value === '') return null;
  const letter = String(value).trim().toUpperCase();
  if (!letter) return null;
  if (!/^[A-Z0-9]{1,2}$/.test(letter)) {
    throw createHttpError(
      `Grupo inválido en el ejercicio "${nombre}" (usa A, B, C… o vacío).`,
      400,
    );
  }
  return letter;
}

function normalizeExercises(ejercicios) {
  if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
    throw createHttpError('Debes incluir al menos un ejercicio.', 400);
  }

  return ejercicios.map((item, index) => {
    const nombre = typeof item.nombre === 'string' ? item.nombre.trim() : '';
    const series = Number(item.series);
    const repeticiones = Number(item.repeticiones);
    const peso = Number(item.peso);
    const indicaciones = typeof item.indicaciones === 'string' ? item.indicaciones.trim() : '';
    const exercise_id = normalizeOptionalExerciseId(item.exercise_id, index, nombre || `#${index + 1}`);

    if (!nombre) {
      throw createHttpError(`El ejercicio #${index + 1} necesita un nombre.`, 400);
    }

    if (!Number.isInteger(series) || series < 1) {
      throw createHttpError(`Series inválidas en el ejercicio "${nombre}".`, 400);
    }

    if (!Number.isInteger(repeticiones) || repeticiones < 1) {
      throw createHttpError(`Repeticiones inválidas en el ejercicio "${nombre}".`, 400);
    }

    if (Number.isNaN(peso) || peso < 0) {
      throw createHttpError(`Peso inválido en el ejercicio "${nombre}".`, 400);
    }

    const rest_time_seconds = normalizeRestTimeSeconds(item.rest_time_seconds, nombre);
    const superset_letter = normalizeSupersetLetter(item.superset_letter, nombre);

    return {
      nombre,
      exercise_id,
      series,
      repeticiones,
      indicaciones,
      peso,
      rest_time_seconds,
      superset_letter,
    };
  });
}

function validateRoutinePayload(payload) {
  const dia_semana = typeof payload.dia_semana === 'string' ? payload.dia_semana.trim() : '';
  const nombre_rutina = typeof payload.nombre_rutina === 'string'
    ? payload.nombre_rutina.trim()
    : '';

  if (!DAYS.includes(dia_semana)) {
    throw createHttpError('Día de la semana inválido.', 400);
  }

  if (!nombre_rutina) {
    throw createHttpError('El nombre de la rutina es obligatorio.', 400);
  }

  return {
    dia_semana,
    nombre_rutina,
    ejercicios: normalizeExercises(payload.ejercicios),
  };
}

function mapExerciseRow(exercise) {
  return {
    id: exercise.id,
    nombre: exercise.nombre,
    exercise_id: exercise.exercise_id ?? null,
    series: exercise.series,
    repeticiones: exercise.repeticiones,
    indicaciones: exercise.indicaciones,
    peso: Number(exercise.peso),
    rest_time_seconds: Number.isFinite(Number(exercise.rest_time_seconds))
      ? Number(exercise.rest_time_seconds)
      : DEFAULT_REST_TIME_SECONDS,
    superset_letter: exercise.superset_letter ?? null,
  };
}

async function fetchRoutinesWithExercises(alumnoId) {
  const [routines] = await db.query(
    `SELECT id, alumno_id, dia_semana, nombre_rutina
     FROM rutinas
     WHERE alumno_id = ?
     ORDER BY FIELD(dia_semana, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'), id ASC`,
    [alumnoId],
  );

  if (routines.length === 0) {
    return [];
  }

  const routineIds = routines.map((r) => r.id);
  const placeholders = routineIds.map(() => '?').join(',');
  const [exercises] = await db.query(
    `SELECT id, rutina_id, nombre, exercise_id, series, repeticiones, indicaciones, peso, rest_time_seconds, superset_letter
     FROM ejercicios
     WHERE rutina_id IN (${placeholders})
     ORDER BY id ASC`,
    routineIds,
  );

  const byRoutine = new Map();
  for (const exercise of exercises) {
    const list = byRoutine.get(exercise.rutina_id) || [];
    list.push(mapExerciseRow(exercise));
    byRoutine.set(exercise.rutina_id, list);
  }

  return routines.map((routine) => ({
    id: routine.id,
    alumno_id: routine.alumno_id,
    dia_semana: routine.dia_semana,
    nombre_rutina: routine.nombre_rutina,
    ejercicios: byRoutine.get(routine.id) || [],
  }));
}

async function assertTrainerOwnsClient(trainerId, clientId) {
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
}

async function getRoutineOwnedByTrainer(routineId, trainerId) {
  const [rows] = await db.query(
    `SELECT r.id, r.alumno_id, r.dia_semana, r.nombre_rutina
     FROM rutinas r
     INNER JOIN usuarios u ON u.id = r.alumno_id
     WHERE r.id = ? AND u.rol = 'client' AND u.trainer_id = ?`,
    [routineId, trainerId],
  );

  if (rows.length === 0) {
    throw createHttpError('Rutina no encontrada o no pertenece a tu cuenta.', 404);
  }

  return rows[0];
}

async function listRoutinesForClientAsTrainer(trainerId, clientId) {
  await assertTrainerOwnsClient(trainerId, clientId);
  const routines = await fetchRoutinesWithExercises(clientId);
  return enrichRoutinesWithLastLogs(routines, clientId);
}

/**
 * Attach media_type / media_url from catalog.
 * Prefer exercise_id (Feature 022); fallback to case-insensitive name for legacy lines.
 */
async function enrichRoutinesWithCatalogMedia(routines, clientId) {
  if (!routines.length) return routines;

  const catalogIds = new Set();
  const names = new Set();

  for (const routine of routines) {
    for (const exercise of routine.ejercicios || []) {
      if (exercise.exercise_id != null) {
        catalogIds.add(Number(exercise.exercise_id));
      } else if (exercise.nombre) {
        names.add(exercise.nombre.trim().toLowerCase());
      }
    }
  }

  const emptyMedia = {
    media_type: 'none',
    media_url: null,
    local_media_path: null,
    name_es: null,
    description_es: null,
  };

  function mapCatalogMedia(row) {
    const localPath = row.local_media_path || null;
    let mediaType = row.media_type || 'none';
    if (localPath) {
      const lower = localPath.toLowerCase();
      if (lower.endsWith('.mp4') || lower.endsWith('.webm')) mediaType = 'video';
      else if (lower.endsWith('.gif')) mediaType = 'gif';
      else if (/\.(jpe?g|png|webp)$/.test(lower)) mediaType = 'image';
    }
    return {
      media_type: mediaType,
      media_url: row.media_url || null,
      local_media_path: localPath,
      name_es: row.name_es ?? null,
      description_es: row.description_es ?? null,
    };
  }

  if (catalogIds.size === 0 && names.size === 0) {
    return routines.map((routine) => ({
      ...routine,
      ejercicios: (routine.ejercicios || []).map((ex) => ({
        ...ex,
        ...emptyMedia,
      })),
    }));
  }

  const [userRows] = await db.query(
    'SELECT trainer_id FROM usuarios WHERE id = ? LIMIT 1',
    [clientId],
  );
  const trainerId = userRows[0]?.trainer_id ?? null;

  const mediaById = new Map();
  const mediaByName = new Map();

  if (catalogIds.size > 0) {
    const idList = [...catalogIds];
    const idPlaceholders = idList.map(() => '?').join(',');
    const [byIdRows] = await db.query(
      `SELECT id, name_es, description_es, media_type, media_url, local_media_path
       FROM exercises
       WHERE id IN (${idPlaceholders})`,
      idList,
    );
    for (const row of byIdRows) {
      mediaById.set(row.id, mapCatalogMedia(row));
    }
  }

  if (names.size > 0) {
    const nameList = [...names];
    const placeholders = nameList.map(() => '?').join(',');
    const params = trainerId == null
      ? [...nameList]
      : [...nameList, trainerId];

    const trainerClause = trainerId == null
      ? 'created_by_trainer_id IS NULL'
      : '(created_by_trainer_id IS NULL OR created_by_trainer_id = ?)';

    const [catalogRows] = await db.query(
      `SELECT name, name_es, description_es, media_type, media_url, local_media_path,
              created_by_trainer_id
       FROM exercises
       WHERE LOWER(TRIM(name)) IN (${placeholders})
         AND ${trainerClause}`,
      params,
    );

    for (const row of catalogRows) {
      const key = String(row.name).trim().toLowerCase();
      const existing = mediaByName.get(key);
      const isTrainerOwned = trainerId != null
        && row.created_by_trainer_id === trainerId;

      if (!existing || isTrainerOwned) {
        mediaByName.set(key, mapCatalogMedia(row));
      }
    }
  }

  return routines.map((routine) => ({
    ...routine,
    ejercicios: (routine.ejercicios || []).map((ex) => {
      if (ex.exercise_id != null && mediaById.has(ex.exercise_id)) {
        const media = mediaById.get(ex.exercise_id);
        return { ...ex, ...media };
      }
      const key = String(ex.nombre || '').trim().toLowerCase();
      const media = mediaByName.get(key);
      return {
        ...ex,
        media_type: media?.media_type || 'none',
        media_url: media?.media_url || null,
        local_media_path: media?.local_media_path || null,
        name_es: media?.name_es || null,
        description_es: media?.description_es || null,
      };
    }),
  }));
}

/**
 * Feature 019: attach last performed set per exercise.
 * Match by client_id + exact exercise name (NOT exercise line id — deep copy changes ids).
 * @returns {Promise<object[]>}
 */
async function enrichRoutinesWithLastLogs(routines, clientId) {
  if (!routines.length) return routines;

  const names = new Set();
  for (const routine of routines) {
    for (const exercise of routine.ejercicios || []) {
      const nombre = typeof exercise.nombre === 'string' ? exercise.nombre.trim() : '';
      if (nombre) names.add(nombre);
    }
  }

  if (names.size === 0) {
    return routines.map((routine) => ({
      ...routine,
      ejercicios: (routine.ejercicios || []).map((ex) => ({
        ...ex,
        last_log: null,
      })),
    }));
  }

  const nameList = [...names];
  const placeholders = nameList.map(() => '?').join(',');
  const [rows] = await db.query(
    `SELECT wsl.exercise_name, wsl.weight, wsl.reps, wsl.created_at
     FROM workout_set_logs wsl
     INNER JOIN workout_sessions ws ON ws.id = wsl.session_id
     WHERE ws.client_id = ?
       AND wsl.exercise_name IN (${placeholders})
     ORDER BY wsl.created_at DESC, wsl.id DESC`,
    [clientId, ...nameList],
  );

  const lastByName = new Map();
  for (const row of rows) {
    const key = String(row.exercise_name || '').trim();
    if (!key || lastByName.has(key)) continue;
    lastByName.set(key, {
      weight: Number(row.weight),
      reps: Number(row.reps),
      date: row.created_at,
    });
  }

  return routines.map((routine) => ({
    ...routine,
    ejercicios: (routine.ejercicios || []).map((ex) => {
      const key = typeof ex.nombre === 'string' ? ex.nombre.trim() : '';
      return {
        ...ex,
        last_log: (key && lastByName.get(key)) || null,
      };
    }),
  }));
}

/**
 * Lista rutinas del cliente sin soft-lock de membresía.
 * Usar desde /me/today (dashboard) o tras assert en el controller de /me/routines.
 */
async function listMyRoutines(clientId) {
  const routines = await fetchRoutinesWithExercises(clientId);
  const withMedia = await enrichRoutinesWithCatalogMedia(routines, clientId);
  return enrichRoutinesWithLastLogs(withMedia, clientId);
}

/**
 * Weekday label (es) from civil YYYY-MM-DD without TZ shift.
 */
function weekdayLabelFromLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcWeekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return DAYS_BY_UTC_WEEKDAY[utcWeekday];
}

function fallbackUtcDateString() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * True if the client finished this routine on the given civil date (YYYY-MM-DD).
 */
async function hasCompletedRoutineOnDate(clientId, routineId, dateStr) {
  if (!routineId) return false;

  const [rows] = await db.query(
    `SELECT id
     FROM workout_sessions
     WHERE client_id = ?
       AND routine_id = ?
       AND status = 'completed'
       AND DATE(COALESCE(finished_at, created_at)) = ?
     LIMIT 1`,
    [clientId, routineId, dateStr],
  );

  return rows.length > 0;
}

/**
 * Feature 038: aggregator for client immersive dashboard.
 * todayRoutine is null when there is no routine for the requested weekday (rest day).
 */
async function getTodayBundle(clientId, dateParam) {
  const date = habitsService.parseLocalDateString(
    dateParam || fallbackUtcDateString(),
    'date',
  );
  const weekday = weekdayLabelFromLocalDate(date);

  const [routines, habits, macrosRow, membership] = await Promise.all([
    listMyRoutines(clientId),
    habitsService.listTodayForClient(clientId, date),
    nutritionService.getByClientId(clientId),
    membershipsService.getForClient(clientId),
  ]);

  let membershipBlocked = false;
  try {
    await membershipsService.assertClientMembershipAccess(clientId);
  } catch (error) {
    if (error.error === 'MEMBERSHIP_BLOCKED') {
      membershipBlocked = true;
    } else {
      throw error;
    }
  }

  const todayRoutine = routines.find((r) => r.dia_semana === weekday) || null;
  const todayCompleted = todayRoutine
    ? await hasCompletedRoutineOnDate(clientId, todayRoutine.id, date)
    : false;

  return {
    date,
    weekday,
    todayRoutine,
    todayCompleted,
    habits,
    macros: macrosRow || null,
    membership,
    membershipBlocked,
  };
}

async function insertExerciseLines(connection, routineId, ejercicios) {
  for (const exercise of ejercicios) {
    await connection.query(
      `INSERT INTO ejercicios
         (rutina_id, nombre, exercise_id, series, repeticiones, indicaciones, peso, rest_time_seconds, superset_letter)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        routineId,
        exercise.nombre,
        exercise.exercise_id,
        exercise.series,
        exercise.repeticiones,
        exercise.indicaciones || null,
        exercise.peso,
        exercise.rest_time_seconds,
        exercise.superset_letter,
      ],
    );
  }
}

async function createRoutine(trainerId, clientId, payload) {
  await assertTrainerOwnsClient(trainerId, clientId);
  const data = validateRoutinePayload(payload);
  await exercisesService.assertCatalogExerciseIdsVisible(
    data.ejercicios.map((ex) => ex.exercise_id),
    trainerId,
  );

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO rutinas (alumno_id, dia_semana, nombre_rutina) VALUES (?, ?, ?)',
      [clientId, data.dia_semana, data.nombre_rutina],
    );

    const routineId = result.insertId;
    await insertExerciseLines(connection, routineId, data.ejercicios);
    await connection.commit();

    const routines = await fetchRoutinesWithExercises(clientId);
    return routines.find((r) => r.id === routineId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateRoutine(trainerId, routineId, payload) {
  await getRoutineOwnedByTrainer(routineId, trainerId);
  const data = validateRoutinePayload(payload);
  await exercisesService.assertCatalogExerciseIdsVisible(
    data.ejercicios.map((ex) => ex.exercise_id),
    trainerId,
  );

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE rutinas SET dia_semana = ?, nombre_rutina = ? WHERE id = ?',
      [data.dia_semana, data.nombre_rutina, routineId],
    );

    await connection.query('DELETE FROM ejercicios WHERE rutina_id = ?', [routineId]);
    await insertExerciseLines(connection, routineId, data.ejercicios);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const [updated] = await db.query(
    'SELECT alumno_id FROM rutinas WHERE id = ?',
    [routineId],
  );

  const routines = await fetchRoutinesWithExercises(updated[0].alumno_id);
  return routines.find((r) => r.id === routineId);
}

async function deleteRoutine(trainerId, routineId) {
  await getRoutineOwnedByTrainer(routineId, trainerId);
  await db.query('DELETE FROM rutinas WHERE id = ?', [routineId]);
}

module.exports = {
  listRoutinesForClientAsTrainer,
  listMyRoutines,
  getTodayBundle,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  DAYS,
};
