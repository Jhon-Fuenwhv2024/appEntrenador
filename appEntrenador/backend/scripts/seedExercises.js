/**
 * Seed global exercises into `exercises` from a local clone of wrkout/exercises.json.
 *
 * Prerequisites:
 *   1. Table `exercises` exists (see backend/db/script_db.sql or createExercisesTable.js).
 *   2. MySQL reachable with the same credentials as backend/src/config/db.js.
 *   3. Clone the dataset (gitignored):
 *        git clone --depth 1 https://github.com/wrkout/exercises.json.git backend/data/wrkout-exercises
 *
 * Usage (from backend/):
 *   node scripts/seedExercises.js
 *   # or: npm run seed:exercises
 *
 * Optional env:
 *   WRKOUT_EXERCISES_DIR — absolute or relative path to the clone root
 *     (must contain an `exercises/` folder with per-exercise subdirs).
 *
 * Media: stores media_type=image and media_url pointing at raw.githubusercontent.com
 * (does not download or host JPG binaries). Idempotent by global `name`.
 */
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

const DEFAULT_CLONE_DIR = path.join(__dirname, '..', 'data', 'wrkout-exercises');
const RAW_BASE =
  'https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises';
const BATCH_SIZE = 50;
const NAME_MAX = 150;
const MUSCLE_MAX = 100;

function resolveCloneRoot() {
  const fromEnv = process.env.WRKOUT_EXERCISES_DIR;
  if (fromEnv && String(fromEnv).trim()) {
    return path.resolve(String(fromEnv).trim());
  }
  return DEFAULT_CLONE_DIR;
}

function resolveExercisesDir(cloneRoot) {
  const direct = path.join(cloneRoot, 'exercises');
  if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) {
    return direct;
  }
  throw new Error(
    `No se encontró la carpeta exercises/ en ${cloneRoot}. ` +
      `Clona el repo:\n` +
      `  git clone --depth 1 https://github.com/wrkout/exercises.json.git backend/data/wrkout-exercises\n` +
      `O define WRKOUT_EXERCISES_DIR apuntando a la raíz del clone.`,
  );
}

/**
 * Prefer images/0.jpg, then 0.png, then first image file under images/.
 * @returns {{ fileName: string } | null}
 */
function findPrimaryImage(exerciseDir) {
  const imagesDir = path.join(exerciseDir, 'images');
  if (!fs.existsSync(imagesDir) || !fs.statSync(imagesDir).isDirectory()) {
    return null;
  }

  const preferred = ['0.jpg', '0.jpeg', '0.png', '0.webp'];
  for (const fileName of preferred) {
    const full = path.join(imagesDir, fileName);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      return { fileName };
    }
  }

  const files = fs
    .readdirSync(imagesDir)
    .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
    .sort();

  if (files.length === 0) {
    return null;
  }
  return { fileName: files[0] };
}

function buildDescription(row) {
  if (Array.isArray(row.instructions) && row.instructions.length > 0) {
    const joined = row.instructions
      .filter((line) => typeof line === 'string' && line.trim())
      .map((line) => line.trim())
      .join('\n');
    if (joined) return joined;
  }
  if (typeof row.description === 'string' && row.description.trim()) {
    return row.description.trim();
  }
  return null;
}

function buildTargetMuscle(row) {
  if (Array.isArray(row.primaryMuscles) && row.primaryMuscles.length > 0) {
    const first = row.primaryMuscles.find(
      (m) => typeof m === 'string' && m.trim(),
    );
    if (first) {
      const muscle = first.trim();
      return muscle.length > MUSCLE_MAX ? muscle.slice(0, MUSCLE_MAX) : muscle;
    }
  }
  return 'full body';
}

function normalizeFromWrkout(row, folderName, imageInfo) {
  let name = typeof row.name === 'string' ? row.name.trim() : '';
  if (!name) {
    throw new Error(`Carpeta ${folderName}: "name" es obligatorio en exercise.json.`);
  }
  if (name.length > NAME_MAX) {
    console.warn(
      `[seedExercises] Nombre truncado (${name.length} → ${NAME_MAX}): ${name}`,
    );
    name = name.slice(0, NAME_MAX);
  }

  const targetMuscle = buildTargetMuscle(row);
  const description = buildDescription(row);

  let mediaType = 'none';
  let mediaUrl = null;
  if (imageInfo) {
    mediaType = 'image';
    // folderName and fileName come from the local filesystem (wrkout layout).
    mediaUrl = `${RAW_BASE}/${folderName}/images/${imageInfo.fileName}`;
    if (mediaUrl.length > 500) {
      console.warn(
        `[seedExercises] media_url demasiado largo para "${name}"; se omite media.`,
      );
      mediaType = 'none';
      mediaUrl = null;
    }
  }

  return {
    name,
    description,
    target_muscle: targetMuscle,
    media_type: mediaType,
    media_url: mediaUrl,
  };
}

function loadWrkoutDataset(exercisesDir) {
  const entries = fs.readdirSync(exercisesDir, { withFileTypes: true });
  const dataset = [];
  let skippedInvalid = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const folderName = entry.name;
    const exerciseDir = path.join(exercisesDir, folderName);
    const jsonPath = path.join(exerciseDir, 'exercise.json');

    if (!fs.existsSync(jsonPath)) {
      skippedInvalid += 1;
      continue;
    }

    let row;
    try {
      row = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (err) {
      console.warn(
        `[seedExercises] JSON inválido en ${jsonPath}: ${err.message}`,
      );
      skippedInvalid += 1;
      continue;
    }

    try {
      const imageInfo = findPrimaryImage(exerciseDir);
      dataset.push(normalizeFromWrkout(row, folderName, imageInfo));
    } catch (err) {
      console.warn(`[seedExercises] Omitido ${folderName}: ${err.message}`);
      skippedInvalid += 1;
    }
  }

  if (dataset.length === 0) {
    throw new Error(
      `No se encontró ningún exercise.json válido bajo ${exercisesDir}.`,
    );
  }

  return { dataset, skippedInvalid };
}

async function loadExistingGlobalNames(connection) {
  const [rows] = await connection.execute(
    `SELECT name FROM exercises WHERE created_by_trainer_id IS NULL`,
  );
  return new Set(rows.map((r) => r.name));
}

async function insertBatch(connection, batch) {
  if (batch.length === 0) return;

  const placeholders = batch.map(() => '(?, ?, ?, ?, ?, NULL)').join(', ');
  const values = [];
  for (const exercise of batch) {
    values.push(
      exercise.name,
      exercise.description,
      exercise.target_muscle,
      exercise.media_type,
      exercise.media_url,
    );
  }

  await connection.execute(
    `INSERT INTO exercises
      (name, description, target_muscle, media_type, media_url, created_by_trainer_id)
     VALUES ${placeholders}`,
    values,
  );
}

async function seed() {
  const cloneRoot = resolveCloneRoot();
  const exercisesDir = resolveExercisesDir(cloneRoot);
  const { dataset, skippedInvalid } = loadWrkoutDataset(exercisesDir);

  const connection = await pool.getConnection();
  let inserted = 0;
  let skippedExisting = 0;

  try {
    const existingNames = await loadExistingGlobalNames(connection);
    const toInsert = [];

    for (const exercise of dataset) {
      if (existingNames.has(exercise.name)) {
        skippedExisting += 1;
        continue;
      }
      existingNames.add(exercise.name);
      toInsert.push(exercise);
    }

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      await insertBatch(connection, batch);
      inserted += batch.length;
    }

    console.log(
      `[seedExercises] Completado. Insertados: ${inserted}. ` +
        `Omitidos (ya existían): ${skippedExisting}. ` +
        `Omitidos (inválidos): ${skippedInvalid}. ` +
        `Total leídos: ${dataset.length}. ` +
        `Fuente: ${exercisesDir}`,
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
