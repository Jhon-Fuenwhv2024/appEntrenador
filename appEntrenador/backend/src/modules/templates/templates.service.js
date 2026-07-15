const db = require('../../config/db');
const clientsService = require('../clients/clients.service');
const exercisesService = require('../exercises/exercises.service');
const { DAYS } = require('../routines/routines.service');

const DEFAULT_REST_TIME_SECONDS = 90;
const MAX_REST_TIME_SECONDS = 900;

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeOptionalExerciseId(raw, nombre) {
  if (raw == null || raw === '') return null;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError(`exercise_id inválido en el ejercicio "${nombre}".`, 400);
  }
  return id;
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

function normalizeExercises(exercises) {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    throw createHttpError('Debes incluir al menos un ejercicio.', 400);
  }

  return exercises.map((item, index) => {
    const nombre = typeof item.nombre === 'string' ? item.nombre.trim() : '';
    const series = Number(item.series);
    const repeticiones = Number(item.repeticiones);
    const peso = Number(item.peso);
    const indicaciones = typeof item.indicaciones === 'string' ? item.indicaciones.trim() : '';
    const exercise_id = normalizeOptionalExerciseId(
      item.exercise_id,
      nombre || `#${index + 1}`,
    );
    const rest_time_seconds = normalizeRestTimeSeconds(
      item.rest_time_seconds,
      nombre || `#${index + 1}`,
    );

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
      exercise_id,
      series,
      repeticiones,
      indicaciones,
      peso,
      rest_time_seconds,
      sort_order: index,
    };
  });
}

function validateTemplatePayload(payload) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : '';

  if (!name) {
    throw createHttpError('El nombre de la plantilla es obligatorio.', 400);
  }

  return {
    name,
    notes: notes || null,
    exercises: normalizeExercises(payload.exercises),
  };
}

function resolveAssignDay(diaSemana) {
  if (diaSemana == null || diaSemana === '') {
    return 'Lunes';
  }

  const day = typeof diaSemana === 'string' ? diaSemana.trim() : '';
  if (!DAYS.includes(day)) {
    throw createHttpError('Día de la semana inválido.', 400);
  }

  return day;
}

function mapTemplateExerciseRow(exercise) {
  return {
    id: exercise.id,
    nombre: exercise.nombre,
    exercise_id: exercise.exercise_id ?? null,
    series: exercise.series,
    repeticiones: exercise.repeticiones,
    peso: Number(exercise.peso),
    rest_time_seconds: Number.isFinite(Number(exercise.rest_time_seconds))
      ? Number(exercise.rest_time_seconds)
      : DEFAULT_REST_TIME_SECONDS,
    indicaciones: exercise.indicaciones,
    sort_order: exercise.sort_order,
  };
}

async function fetchTemplatesWithExercises(trainerId, templateId = null) {
  const params = [trainerId];
  let where = 'WHERE t.trainer_id = ?';

  if (templateId != null) {
    where += ' AND t.id = ?';
    params.push(templateId);
  }

  const [templates] = await db.query(
    `SELECT t.id, t.trainer_id, t.name, t.notes, t.created_at, t.updated_at
     FROM routine_templates t
     ${where}
     ORDER BY t.updated_at DESC, t.id DESC`,
    params,
  );

  if (templates.length === 0) {
    return templateId != null ? null : [];
  }

  const ids = templates.map((t) => t.id);
  const placeholders = ids.map(() => '?').join(',');
  const [exercises] = await db.query(
    `SELECT id, template_id, nombre, exercise_id, series, repeticiones, peso, rest_time_seconds, indicaciones, sort_order
     FROM template_exercises
     WHERE template_id IN (${placeholders})
     ORDER BY sort_order ASC, id ASC`,
    ids,
  );

  const byTemplate = new Map();
  for (const exercise of exercises) {
    const list = byTemplate.get(exercise.template_id) || [];
    list.push(mapTemplateExerciseRow(exercise));
    byTemplate.set(exercise.template_id, list);
  }

  const mapped = templates.map((template) => ({
    id: template.id,
    trainer_id: template.trainer_id,
    name: template.name,
    notes: template.notes,
    created_at: template.created_at,
    updated_at: template.updated_at,
    exercises: byTemplate.get(template.id) || [],
  }));

  if (templateId != null) {
    return mapped[0] || null;
  }

  return mapped;
}

async function getTemplateOwnedByTrainer(templateId, trainerId) {
  const template = await fetchTemplatesWithExercises(trainerId, templateId);

  if (!template) {
    throw createHttpError('Plantilla no encontrada o no pertenece a tu cuenta.', 404);
  }

  return template;
}

async function listTemplates(trainerId) {
  return fetchTemplatesWithExercises(trainerId);
}

async function getTemplateById(trainerId, templateId) {
  return getTemplateOwnedByTrainer(templateId, trainerId);
}

async function insertTemplateExerciseLines(connection, templateId, exercises) {
  for (const exercise of exercises) {
    await connection.query(
      `INSERT INTO template_exercises
         (template_id, nombre, exercise_id, series, repeticiones, peso, rest_time_seconds, indicaciones, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        templateId,
        exercise.nombre,
        exercise.exercise_id,
        exercise.series,
        exercise.repeticiones,
        exercise.peso,
        exercise.rest_time_seconds,
        exercise.indicaciones || null,
        exercise.sort_order,
      ],
    );
  }
}

async function createTemplate(trainerId, payload) {
  const data = validateTemplatePayload(payload);
  await exercisesService.assertCatalogExerciseIdsVisible(
    data.exercises.map((ex) => ex.exercise_id),
    trainerId,
  );

  const connection = await db.getConnection();
  let templateId;

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO routine_templates (trainer_id, name, notes)
       VALUES (?, ?, ?)`,
      [trainerId, data.name, data.notes],
    );

    templateId = result.insertId;
    await insertTemplateExerciseLines(connection, templateId, data.exercises);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getTemplateOwnedByTrainer(templateId, trainerId);
}

async function updateTemplate(trainerId, templateId, payload) {
  await getTemplateOwnedByTrainer(templateId, trainerId);
  const data = validateTemplatePayload(payload);
  await exercisesService.assertCatalogExerciseIdsVisible(
    data.exercises.map((ex) => ex.exercise_id),
    trainerId,
  );

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE routine_templates
       SET name = ?, notes = ?
       WHERE id = ? AND trainer_id = ?`,
      [data.name, data.notes, templateId, trainerId],
    );

    await connection.query(
      'DELETE FROM template_exercises WHERE template_id = ?',
      [templateId],
    );

    await insertTemplateExerciseLines(connection, templateId, data.exercises);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getTemplateOwnedByTrainer(templateId, trainerId);
}

async function deleteTemplate(trainerId, templateId) {
  await getTemplateOwnedByTrainer(templateId, trainerId);
  await db.query(
    'DELETE FROM routine_templates WHERE id = ? AND trainer_id = ?',
    [templateId, trainerId],
  );
}

/**
 * Deep copy: inserts into rutinas/ejercicios. No FK from assigned routine back to template.
 * Copies exercise_id when present (Feature 022).
 */
async function assignTemplate(trainerId, templateId, payload = {}) {
  const template = await getTemplateOwnedByTrainer(templateId, trainerId);
  const clientId = Number(payload.clientId);

  if (!Number.isInteger(clientId) || clientId < 1) {
    throw createHttpError('clientId inválido.', 400);
  }

  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
  const dia_semana = resolveAssignDay(payload.dia_semana);

  if (!template.exercises.length) {
    throw createHttpError('La plantilla no tiene ejercicios para asignar.', 400);
  }

  const connection = await db.getConnection();
  let routineId;

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO rutinas (alumno_id, dia_semana, nombre_rutina) VALUES (?, ?, ?)',
      [clientId, dia_semana, template.name],
    );

    routineId = result.insertId;

    for (const exercise of template.exercises) {
      await connection.query(
        `INSERT INTO ejercicios
           (rutina_id, nombre, exercise_id, series, repeticiones, indicaciones, peso, rest_time_seconds)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          routineId,
          exercise.nombre,
          exercise.exercise_id,
          exercise.series,
          exercise.repeticiones,
          exercise.indicaciones || null,
          exercise.peso,
          Number.isFinite(Number(exercise.rest_time_seconds))
            ? Number(exercise.rest_time_seconds)
            : DEFAULT_REST_TIME_SECONDS,
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

  const [routines] = await db.query(
    `SELECT id, alumno_id, dia_semana, nombre_rutina
     FROM rutinas
     WHERE id = ?`,
    [routineId],
  );

  const [exercises] = await db.query(
    `SELECT id, rutina_id, nombre, exercise_id, series, repeticiones, indicaciones, peso, rest_time_seconds
     FROM ejercicios
     WHERE rutina_id = ?
     ORDER BY id ASC`,
    [routineId],
  );

  return {
    id: routines[0].id,
    alumno_id: routines[0].alumno_id,
    dia_semana: routines[0].dia_semana,
    nombre_rutina: routines[0].nombre_rutina,
    ejercicios: exercises.map((exercise) => ({
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
    })),
  };
}

module.exports = {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  assignTemplate,
};
