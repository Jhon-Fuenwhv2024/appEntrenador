const db = require('../../config/db');

const ALLOWED_MEDIA_TYPES = new Set(['image', 'gif', 'youtube', 'video', 'none']);

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function mapExerciseRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    target_muscle: row.target_muscle,
    media_type: row.media_type,
    media_url: row.media_url,
    created_by_trainer_id: row.created_by_trainer_id,
    is_global: row.created_by_trainer_id == null,
  };
}

function normalizeExercisePayload(payload) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const targetMuscle =
    typeof payload.target_muscle === 'string' ? payload.target_muscle.trim() : '';
  const description =
    typeof payload.description === 'string' && payload.description.trim()
      ? payload.description.trim()
      : null;

  if (!name) {
    throw createHttpError('El nombre del ejercicio es obligatorio.', 400);
  }
  if (!targetMuscle) {
    throw createHttpError('El grupo muscular (target_muscle) es obligatorio.', 400);
  }

  const mediaTypeRaw =
    typeof payload.media_type === 'string' && payload.media_type.trim()
      ? payload.media_type.trim().toLowerCase()
      : 'none';

  if (!ALLOWED_MEDIA_TYPES.has(mediaTypeRaw)) {
    throw createHttpError(
      `media_type inválido. Permitidos: ${[...ALLOWED_MEDIA_TYPES].join(', ')}`,
      400,
    );
  }

  const mediaUrl =
    mediaTypeRaw === 'none'
      ? null
      : (typeof payload.media_url === 'string' && payload.media_url.trim()
        ? payload.media_url.trim()
        : null);

  if (mediaTypeRaw !== 'none' && !mediaUrl) {
    throw createHttpError('media_url es obligatorio cuando hay tipo de media.', 400);
  }

  return {
    name,
    description,
    target_muscle: targetMuscle,
    media_type: mediaTypeRaw,
    media_url: mediaUrl,
  };
}

async function getExerciseVisibleToTrainer(exerciseId, trainerId) {
  const [rows] = await db.query(
    `SELECT id, name, description, target_muscle, media_type, media_url, created_by_trainer_id
     FROM exercises
     WHERE id = ?
       AND (created_by_trainer_id IS NULL OR created_by_trainer_id = ?)
     LIMIT 1`,
    [exerciseId, trainerId],
  );

  if (rows.length === 0) {
    throw createHttpError('Ejercicio no encontrado o no tienes acceso.', 404);
  }

  return rows[0];
}

async function assertNameAvailable(name, trainerId, excludeId = null) {
  const params = [name, trainerId];
  let sql = `
    SELECT id FROM exercises
    WHERE name = ?
      AND (created_by_trainer_id IS NULL OR created_by_trainer_id = ?)
  `;

  if (excludeId != null) {
    sql += ' AND id <> ?';
    params.push(excludeId);
  }

  sql += ' LIMIT 1';

  const [existing] = await db.query(sql, params);
  if (existing.length > 0) {
    throw createHttpError('Ya existe un ejercicio con ese nombre en tu catálogo.', 409);
  }
}

const DEFAULT_LIST_LIMIT = 6;
const MAX_LIST_LIMIT = 100;

function parseListLimit(raw) {
  if (raw == null || raw === '') {
    return DEFAULT_LIST_LIMIT;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    return DEFAULT_LIST_LIMIT;
  }
  return Math.min(Math.floor(n), MAX_LIST_LIMIT);
}

function parseListPage(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.floor(n);
}

/**
 * Lists global exercises + those owned by the trainer.
 * Optional `q` filters by name (LIKE). Paginated with page + limit (default 10, max 100).
 * @returns {{ items: object[], total: number, limit: number, page: number, totalPages: number }}
 */
async function listExercisesForTrainer(trainerId, q, limitRaw, pageRaw) {
  const limit = parseListLimit(limitRaw);
  const pageRequested = parseListPage(pageRaw);
  const params = [trainerId];
  let whereSql = `
    WHERE (created_by_trainer_id IS NULL OR created_by_trainer_id = ?)
  `;

  if (q && String(q).trim()) {
    whereSql += ' AND name LIKE ?';
    params.push(`%${String(q).trim()}%`);
  }

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM exercises ${whereSql}`,
    params,
  );
  const total = Number(countRows[0]?.total) || 0;
  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
  const page = Math.min(pageRequested, totalPages);
  const offset = (page - 1) * limit;

  // limit/offset are sanitized integers (not user strings) — safe to embed.
  const [rows] = await db.query(
    `SELECT id, name, description, target_muscle, media_type, media_url, created_by_trainer_id
     FROM exercises
     ${whereSql}
     ORDER BY name ASC
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  return {
    items: rows.map(mapExerciseRow),
    total,
    limit,
    page,
    totalPages,
  };
}

/**
 * Creates a trainer-private catalog entry.
 */
async function createExerciseForTrainer(trainerId, payload) {
  const data = normalizeExercisePayload(payload);
  await assertNameAvailable(data.name, trainerId);

  const [result] = await db.query(
    `INSERT INTO exercises
      (name, description, target_muscle, media_type, media_url, created_by_trainer_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.description,
      data.target_muscle,
      data.media_type,
      data.media_url,
      trainerId,
    ],
  );

  const [rows] = await db.query(
    `SELECT id, name, description, target_muscle, media_type, media_url, created_by_trainer_id
     FROM exercises WHERE id = ?`,
    [result.insertId],
  );

  return mapExerciseRow(rows[0]);
}

/**
 * Updates a catalog exercise visible to the trainer (global or own).
 */
async function updateExerciseForTrainer(trainerId, exerciseId, payload) {
  const id = Number(exerciseId);
  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError('ID de ejercicio inválido.', 400);
  }

  await getExerciseVisibleToTrainer(id, trainerId);
  const data = normalizeExercisePayload(payload);
  await assertNameAvailable(data.name, trainerId, id);

  await db.query(
    `UPDATE exercises
     SET name = ?, description = ?, target_muscle = ?, media_type = ?, media_url = ?
     WHERE id = ?
       AND (created_by_trainer_id IS NULL OR created_by_trainer_id = ?)`,
    [
      data.name,
      data.description,
      data.target_muscle,
      data.media_type,
      data.media_url,
      id,
      trainerId,
    ],
  );

  const [rows] = await db.query(
    `SELECT id, name, description, target_muscle, media_type, media_url, created_by_trainer_id
     FROM exercises WHERE id = ?`,
    [id],
  );

  return mapExerciseRow(rows[0]);
}

/**
 * Deletes a catalog exercise visible to the trainer (global or own).
 */
async function deleteExerciseForTrainer(trainerId, exerciseId) {
  const id = Number(exerciseId);
  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError('ID de ejercicio inválido.', 400);
  }

  await getExerciseVisibleToTrainer(id, trainerId);

  const [result] = await db.query(
    `DELETE FROM exercises
     WHERE id = ?
       AND (created_by_trainer_id IS NULL OR created_by_trainer_id = ?)`,
    [id, trainerId],
  );

  if (result.affectedRows === 0) {
    throw createHttpError('Ejercicio no encontrado o no tienes acceso.', 404);
  }

  return { id };
}

module.exports = {
  listExercisesForTrainer,
  createExerciseForTrainer,
  updateExerciseForTrainer,
  deleteExerciseForTrainer,
  createHttpError,
};
