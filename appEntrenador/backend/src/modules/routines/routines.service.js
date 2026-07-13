const db = require('../../config/db');
const clientsService = require('../clients/clients.service');

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
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

    return {
      nombre,
      series,
      repeticiones,
      indicaciones,
      peso,
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
    `SELECT id, rutina_id, nombre, series, repeticiones, indicaciones, peso
     FROM ejercicios
     WHERE rutina_id IN (${placeholders})
     ORDER BY id ASC`,
    routineIds,
  );

  const byRoutine = new Map();
  for (const exercise of exercises) {
    const list = byRoutine.get(exercise.rutina_id) || [];
    list.push({
      id: exercise.id,
      nombre: exercise.nombre,
      series: exercise.series,
      repeticiones: exercise.repeticiones,
      indicaciones: exercise.indicaciones,
      peso: Number(exercise.peso),
    });
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
  return fetchRoutinesWithExercises(clientId);
}

/**
 * Attach media_type / media_url from catalog by case-insensitive name.
 * Prefers the client's trainer private entries over globals.
 */
async function enrichRoutinesWithCatalogMedia(routines, clientId) {
  if (!routines.length) return routines;

  const names = new Set();
  for (const routine of routines) {
    for (const exercise of routine.ejercicios || []) {
      if (exercise.nombre) names.add(exercise.nombre.trim().toLowerCase());
    }
  }

  if (names.size === 0) {
    return routines.map((routine) => ({
      ...routine,
      ejercicios: (routine.ejercicios || []).map((ex) => ({
        ...ex,
        media_type: 'none',
        media_url: null,
      })),
    }));
  }

  const [userRows] = await db.query(
    'SELECT trainer_id FROM usuarios WHERE id = ? LIMIT 1',
    [clientId],
  );
  const trainerId = userRows[0]?.trainer_id ?? null;

  const nameList = [...names];
  const placeholders = nameList.map(() => '?').join(',');
  const params = trainerId == null
    ? [...nameList]
    : [...nameList, trainerId];

  const trainerClause = trainerId == null
    ? 'created_by_trainer_id IS NULL'
    : '(created_by_trainer_id IS NULL OR created_by_trainer_id = ?)';

  const [catalogRows] = await db.query(
    `SELECT name, media_type, media_url, created_by_trainer_id
     FROM exercises
     WHERE LOWER(TRIM(name)) IN (${placeholders})
       AND ${trainerClause}`,
    params,
  );

  const mediaByName = new Map();
  for (const row of catalogRows) {
    const key = String(row.name).trim().toLowerCase();
    const existing = mediaByName.get(key);
    const isTrainerOwned = trainerId != null
      && row.created_by_trainer_id === trainerId;

    if (!existing || isTrainerOwned) {
      mediaByName.set(key, {
        media_type: row.media_type || 'none',
        media_url: row.media_url || null,
      });
    }
  }

  return routines.map((routine) => ({
    ...routine,
    ejercicios: (routine.ejercicios || []).map((ex) => {
      const key = String(ex.nombre || '').trim().toLowerCase();
      const media = mediaByName.get(key);
      return {
        ...ex,
        media_type: media?.media_type || 'none',
        media_url: media?.media_url || null,
      };
    }),
  }));
}

async function listMyRoutines(clientId) {
  const routines = await fetchRoutinesWithExercises(clientId);
  return enrichRoutinesWithCatalogMedia(routines, clientId);
}

async function createRoutine(trainerId, clientId, payload) {
  await assertTrainerOwnsClient(trainerId, clientId);
  const data = validateRoutinePayload(payload);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO rutinas (alumno_id, dia_semana, nombre_rutina) VALUES (?, ?, ?)',
      [clientId, data.dia_semana, data.nombre_rutina],
    );

    const routineId = result.insertId;

    for (const exercise of data.ejercicios) {
      await connection.query(
        `INSERT INTO ejercicios (rutina_id, nombre, series, repeticiones, indicaciones, peso)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          routineId,
          exercise.nombre,
          exercise.series,
          exercise.repeticiones,
          exercise.indicaciones || null,
          exercise.peso,
        ],
      );
    }

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
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE rutinas SET dia_semana = ?, nombre_rutina = ? WHERE id = ?',
      [data.dia_semana, data.nombre_rutina, routineId],
    );

    await connection.query('DELETE FROM ejercicios WHERE rutina_id = ?', [routineId]);

    for (const exercise of data.ejercicios) {
      await connection.query(
        `INSERT INTO ejercicios (rutina_id, nombre, series, repeticiones, indicaciones, peso)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          routineId,
          exercise.nombre,
          exercise.series,
          exercise.repeticiones,
          exercise.indicaciones || null,
          exercise.peso,
        ],
      );
    }

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
  createRoutine,
  updateRoutine,
  deleteRoutine,
  DAYS,
};
