/**
 * Seed global exercises into `exercises` catalog from a local JSON file.
 *
 * Prerequisites:
 *   1. Apply the CREATE TABLE exercises DDL (see backend/db/script_db.sql) after review.
 *   2. MySQL reachable with the same credentials as backend/src/config/db.js.
 *
 * Usage (from backend/):
 *   node scripts/seedExercises.js
 *
 * Does not call external APIs. Inserts with created_by_trainer_id = NULL (globals).
 * Skips rows whose name already exists as a global exercise (idempotent by name).
 */
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

const DATASET_PATH = path.join(__dirname, 'exercises_dataset.json');
const ALLOWED_MEDIA_TYPES = new Set(['image', 'gif', 'youtube', 'video', 'none']);

function loadDataset() {
  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(
      `No se encontró el dataset en ${DATASET_PATH}. Crea exercises_dataset.json antes de ejecutar el seed.`,
    );
  }

  let raw;
  try {
    raw = fs.readFileSync(DATASET_PATH, 'utf8');
  } catch (err) {
    throw new Error(`No se pudo leer ${DATASET_PATH}: ${err.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`JSON inválido en exercises_dataset.json: ${err.message}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('exercises_dataset.json debe ser un array no vacío de ejercicios.');
  }

  return data;
}

function normalizeExercise(row, index) {
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  const targetMuscle =
    typeof row.target_muscle === 'string' ? row.target_muscle.trim() : '';

  if (!name) {
    throw new Error(`Fila ${index}: "name" es obligatorio.`);
  }
  if (!targetMuscle) {
    throw new Error(`Fila ${index} (${name}): "target_muscle" es obligatorio.`);
  }

  const mediaTypeRaw =
    typeof row.media_type === 'string' && row.media_type.trim()
      ? row.media_type.trim().toLowerCase()
      : 'none';

  if (!ALLOWED_MEDIA_TYPES.has(mediaTypeRaw)) {
    throw new Error(
      `Fila ${index} (${name}): media_type inválido "${row.media_type}". ` +
        `Permitidos: ${[...ALLOWED_MEDIA_TYPES].join(', ')}`,
    );
  }

  const description =
    typeof row.description === 'string' && row.description.trim()
      ? row.description.trim()
      : null;

  const mediaUrl =
    typeof row.media_url === 'string' && row.media_url.trim()
      ? row.media_url.trim()
      : null;

  return {
    name,
    description,
    target_muscle: targetMuscle,
    media_type: mediaTypeRaw,
    media_url: mediaUrl,
  };
}

async function seed() {
  const dataset = loadDataset().map(normalizeExercise);
  let inserted = 0;
  let skipped = 0;

  const connection = await pool.getConnection();

  try {
    for (const exercise of dataset) {
      const [existing] = await connection.execute(
        `SELECT id FROM exercises
         WHERE name = ? AND created_by_trainer_id IS NULL
         LIMIT 1`,
        [exercise.name],
      );

      if (existing.length > 0) {
        skipped += 1;
        continue;
      }

      await connection.execute(
        `INSERT INTO exercises
          (name, description, target_muscle, media_type, media_url, created_by_trainer_id)
         VALUES (?, ?, ?, ?, ?, NULL)`,
        [
          exercise.name,
          exercise.description,
          exercise.target_muscle,
          exercise.media_type,
          exercise.media_url,
        ],
      );
      inserted += 1;
    }

    console.log(
      `[seedExercises] Completado. Insertados: ${inserted}. Omitidos (ya existían): ${skipped}. Total dataset: ${dataset.length}.`,
    );
  } finally {
    connection.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('[seedExercises] Error:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
