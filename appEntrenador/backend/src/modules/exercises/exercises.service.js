const db = require('../../config/db');
const { ALLOWED_MUSCLES } = require('../admin-exercises/muscleTaxonomy');

const ALLOWED_MEDIA_TYPES = new Set(['image', 'gif', 'youtube', 'video', 'none']);
const ALLOWED_MUSCLE_SET = new Set(ALLOWED_MUSCLES);

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

const EXERCISE_SELECT_COLS = `
  id, name, name_es, description, description_es,
  target_muscle, target_muscle_es, primary_muscle, secondary_muscles, is_warmup,
  media_type, media_url, local_media_path,
  created_by_trainer_id
`;

function parseSecondaryMuscles(raw) {
  if (Array.isArray(raw)) {
    return raw.filter((m) => typeof m === 'string' && m.trim()).map((m) => m.trim());
  }
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((m) => typeof m === 'string' && m.trim()).map((m) => m.trim())
      : [];
  } catch {
    return [];
  }
}

function mapExerciseRow(row) {
  return {
    id: row.id,
    name: row.name,
    name_es: row.name_es ?? null,
    description: row.description,
    description_es: row.description_es ?? null,
    target_muscle: row.target_muscle,
    target_muscle_es: row.target_muscle_es ?? null,
    primary_muscle: row.primary_muscle ?? null,
    secondary_muscles: parseSecondaryMuscles(row.secondary_muscles),
    is_warmup: row.is_warmup === true || row.is_warmup === 1 || row.is_warmup === '1',
    media_type: row.media_type,
    media_url: row.media_url,
    local_media_path: row.local_media_path ?? null,
    created_by_trainer_id: row.created_by_trainer_id,
    is_global: row.created_by_trainer_id == null,
  };
}

function normalizeExercisePayload(payload) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const targetMuscle =
    typeof payload.target_muscle === 'string' ? payload.target_muscle.trim() : '';
  const primaryFromPayload =
    typeof payload.primary_muscle === 'string' ? payload.primary_muscle.trim() : '';
  const description =
    typeof payload.description === 'string' && payload.description.trim()
      ? payload.description.trim()
      : null;

  if (!name) {
    throw createHttpError('El nombre del ejercicio es obligatorio.', 400);
  }
  if (!targetMuscle && !primaryFromPayload) {
    throw createHttpError('El grupo muscular es obligatorio.', 400);
  }

  const primaryMuscle = primaryFromPayload || targetMuscle;
  const resolvedTarget = targetMuscle || primaryMuscle;

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
    target_muscle: resolvedTarget,
    primary_muscle: ALLOWED_MUSCLE_SET.has(primaryMuscle) ? primaryMuscle : null,
    media_type: mediaTypeRaw,
    media_url: mediaUrl,
  };
}

async function getExerciseVisibleToTrainer(exerciseId, trainerId) {
  const [rows] = await db.query(
    `SELECT ${EXERCISE_SELECT_COLS}
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

/**
 * Batch-validate optional catalog IDs (global or owned by trainer).
 * @param {number[]} exerciseIds
 * @param {number} trainerId
 */
async function assertCatalogExerciseIdsVisible(exerciseIds, trainerId) {
  const ids = [...new Set(
    (exerciseIds || [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0),
  )];

  if (ids.length === 0) return;

  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await db.query(
    `SELECT id FROM exercises
     WHERE id IN (${placeholders})
       AND (created_by_trainer_id IS NULL OR created_by_trainer_id = ?)`,
    [...ids, trainerId],
  );

  const allowed = new Set(rows.map((row) => row.id));
  for (const id of ids) {
    if (!allowed.has(id)) {
      throw createHttpError(
        `El ejercicio de catálogo #${id} no existe o no tienes acceso.`,
        400,
      );
    }
  }
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

function parseTruthyQueryFlag(raw) {
  if (raw == null || raw === '') return false;
  const v = String(raw).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

/**
 * Lists global exercises + those owned by the trainer.
 * Optional `q`, `muscle` (primary/secondary HITL), `warmup=1`, `enriched=1`.
 * @returns {{ items: object[], total: number, limit: number, page: number, totalPages: number }}
 */
async function listExercisesForTrainer(
  trainerId,
  q,
  limitRaw,
  pageRaw,
  enrichedRaw,
  muscleRaw,
  warmupRaw,
) {
  const limit = parseListLimit(limitRaw);
  const pageRequested = parseListPage(pageRaw);
  const onlyEnriched = parseTruthyQueryFlag(enrichedRaw);
  const onlyWarmup = parseTruthyQueryFlag(warmupRaw);
  const muscle = typeof muscleRaw === 'string' ? muscleRaw.trim() : '';
  const params = [trainerId];
  let whereSql = `
    WHERE (created_by_trainer_id IS NULL OR created_by_trainer_id = ?)
  `;

  if (onlyEnriched) {
    whereSql += ` AND (
      (name_es IS NOT NULL AND TRIM(name_es) <> '')
      OR (local_media_path IS NOT NULL AND TRIM(local_media_path) <> '')
    )`;
  }

  if (onlyWarmup) {
    whereSql += ' AND is_warmup = 1';
  }

  if (muscle) {
    if (!ALLOWED_MUSCLE_SET.has(muscle)) {
      throw createHttpError(
        `muscle inválido. Permitidos: ${ALLOWED_MUSCLES.join(', ')}`,
        400,
      );
    }
    // Principal exacto o secundario en JSON/LONGTEXT (MariaDB-safe).
    whereSql += ` AND (
      primary_muscle = ?
      OR secondary_muscles LIKE ?
    )`;
    params.push(muscle, `%"${muscle}"%`);
  }

  if (q && String(q).trim()) {
    const like = `%${String(q).trim()}%`;
    whereSql += ` AND (
      name LIKE ? OR name_es LIKE ?
      OR target_muscle LIKE ? OR target_muscle_es LIKE ?
      OR primary_muscle LIKE ?
    )`;
    params.push(like, like, like, like, like);
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
    `SELECT ${EXERCISE_SELECT_COLS}
     FROM exercises
     ${whereSql}
     ORDER BY COALESCE(name_es, name) ASC
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
      (name, description, target_muscle, primary_muscle, media_type, media_url, created_by_trainer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.description,
      data.target_muscle,
      data.primary_muscle,
      data.media_type,
      data.media_url,
      trainerId,
    ],
  );

  const [rows] = await db.query(
    `SELECT ${EXERCISE_SELECT_COLS}
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
     SET name = ?, description = ?, target_muscle = ?, primary_muscle = ?,
         media_type = ?, media_url = ?
     WHERE id = ?
       AND (created_by_trainer_id IS NULL OR created_by_trainer_id = ?)`,
    [
      data.name,
      data.description,
      data.target_muscle,
      data.primary_muscle,
      data.media_type,
      data.media_url,
      id,
      trainerId,
    ],
  );

  const [rows] = await db.query(
    `SELECT ${EXERCISE_SELECT_COLS}
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
  getExerciseVisibleToTrainer,
  assertCatalogExerciseIdsVisible,
  createHttpError,
};
