const db = require('../../config/db');
const { ALLOWED_MUSCLES } = require('./muscleTaxonomy');

const ALLOWED_MUSCLE_SET = new Set(ALLOWED_MUSCLES);

function createHttpError(message, code) {
  const error = new Error(message);
  error.statusCode = code;
  return error;
}

function mapUntaggedRow(row) {
  return {
    id: row.id,
    name: row.name,
    name_es: row.name_es ?? null,
    media_type: row.media_type,
    media_url: row.media_url ?? null,
    local_media_path: row.local_media_path ?? null,
  };
}

/**
 * Progreso del etiquetado HITL sobre todo el catálogo.
 * @returns {Promise<{ total: number, tagged: number, remaining: number, percent: number }>}
 */
async function getTaggingProgress() {
  const [rows] = await db.query(
    `SELECT
       COUNT(*) AS total,
       COALESCE(SUM(
         CASE
           WHEN primary_muscle IS NOT NULL AND TRIM(primary_muscle) <> '' THEN 1
           ELSE 0
         END
       ), 0) AS tagged
     FROM exercises`,
  );

  const total = Number(rows[0]?.total) || 0;
  const tagged = Number(rows[0]?.tagged) || 0;
  const remaining = Math.max(0, total - tagged);
  const percent = total === 0 ? 100 : Math.round((tagged / total) * 100);

  return {
    total,
    tagged,
    remaining,
    percent,
  };
}

/**
 * Siguiente ejercicio sin músculo principal asignado (HITL).
 * @returns {Promise<object|null>}
 */
async function getNextUntaggedExercise() {
  const [rows] = await db.query(
    `SELECT id, name, name_es, media_type, media_url, local_media_path
     FROM exercises
     WHERE primary_muscle IS NULL
        OR TRIM(primary_muscle) = ''
     ORDER BY id ASC
     LIMIT 1`,
  );

  if (rows.length === 0) {
    return null;
  }

  return mapUntaggedRow(rows[0]);
}

/**
 * @param {unknown} value
 * @returns {boolean|null}
 */
function parseIsWarmup(value) {
  if (value === true || value === 1 || value === '1' || value === 'true') {
    return true;
  }
  if (value === false || value === 0 || value === '0' || value === 'false') {
    return false;
  }
  return null;
}

/**
 * @param {number} exerciseId
 * @param {{ primary_muscle: string, secondary_muscles?: string[], is_warmup?: boolean }} payload
 */
async function tagExercise(exerciseId, payload) {
  const id = Number(exerciseId);
  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError('ID de ejercicio inválido.', 400);
  }

  const primary =
    typeof payload?.primary_muscle === 'string' ? payload.primary_muscle.trim() : '';

  if (!primary) {
    throw createHttpError('primary_muscle es obligatorio.', 400);
  }
  if (!ALLOWED_MUSCLE_SET.has(primary)) {
    throw createHttpError(
      `primary_muscle inválido. Permitidos: ${ALLOWED_MUSCLES.join(', ')}`,
      400,
    );
  }

  const isWarmup = parseIsWarmup(payload?.is_warmup);
  if (isWarmup === null) {
    throw createHttpError(
      'is_warmup es obligatorio (true = calentamiento, false = no).',
      400,
    );
  }

  let secondary = [];
  if (payload?.secondary_muscles !== undefined && payload?.secondary_muscles !== null) {
    if (!Array.isArray(payload.secondary_muscles)) {
      throw createHttpError('secondary_muscles debe ser un array de strings.', 400);
    }
    secondary = payload.secondary_muscles
      .map((m) => (typeof m === 'string' ? m.trim() : ''))
      .filter(Boolean);

    for (const muscle of secondary) {
      if (!ALLOWED_MUSCLE_SET.has(muscle)) {
        throw createHttpError(
          `secondary_muscles contiene valor inválido: ${muscle}`,
          400,
        );
      }
      if (muscle === primary) {
        throw createHttpError(
          'Un músculo no puede ser principal y secundario a la vez.',
          400,
        );
      }
    }
    secondary = [...new Set(secondary)];
  }

  const [existing] = await db.query(
    'SELECT id FROM exercises WHERE id = ? LIMIT 1',
    [id],
  );
  if (existing.length === 0) {
    throw createHttpError('Ejercicio no encontrado.', 404);
  }

  // MariaDB: CAST(? AS JSON) falla; guardar string JSON en columna JSON/LONGTEXT.
  const secondaryJson = JSON.stringify(secondary);

  await db.query(
    `UPDATE exercises
     SET primary_muscle = ?, secondary_muscles = ?, is_warmup = ?
     WHERE id = ?`,
    [primary, secondaryJson, isWarmup ? 1 : 0, id],
  );

  return {
    id,
    primary_muscle: primary,
    secondary_muscles: secondary,
    is_warmup: isWarmup,
  };
}

module.exports = {
  ALLOWED_MUSCLES,
  getTaggingProgress,
  getNextUntaggedExercise,
  tagExercise,
};
