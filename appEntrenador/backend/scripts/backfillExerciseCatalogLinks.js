/**
 * Relink routine/template lines to GIF-backed catalog exercises only (Feature 044).
 *
 * - Does NOT re-import wrkout GitHub JPG exercises (those were intentionally removed).
 * - Matches by name / name_es / aliases against rows WITH local_media_path.
 * - Removes global exercises without local GIF that we may have re-imported by mistake.
 *
 * Usage (from backend/):
 *   node scripts/backfillExerciseCatalogLinks.js --dry-run
 *   node scripts/backfillExerciseCatalogLinks.js --confirm
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = require('../src/config/db');

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[/_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Free-text legacy → normalized catalog key (must resolve to a GIF-backed row). */
const ALIASES = {
  'board press': 'barbell bench press medium grip',
  'bench sprint': 'sprints con rodilla alta',
  'adductor groin': 'zancada lateral con mancuerna',
  'ab roller': 'wheel rollout de rodillas',
  'bench jump': 'sentadilla con salto con mancuernas',
  'bent over low pulley side lateral': 'elevaciones laterales horizontales con mancuernas',
  'elevaciones laterales': 'elevaciones laterales horizontales con mancuernas',
  'press militar': 'press militar en polea',
  'sentadilla profunda': 'sentadilla profunda con barra',
  'extension de cuadriceps': 'extension de cuadriceps en maquina',
};

function parseArgs(argv) {
  return {
    dryRun: !argv.includes('--confirm'),
    confirm: argv.includes('--confirm'),
  };
}

async function loadGifCatalogIndex(connection) {
  const [rows] = await connection.query(
    `SELECT id, name, name_es
     FROM exercises
     WHERE created_by_trainer_id IS NULL
       AND local_media_path IS NOT NULL
       AND TRIM(local_media_path) <> ''`,
  );
  const byKey = new Map();
  for (const row of rows) {
    for (const label of [row.name, row.name_es]) {
      const key = normalizeKey(label);
      if (key && !byKey.has(key)) byKey.set(key, row);
    }
  }
  return byKey;
}

function resolveMatch(nombre, index) {
  const key = normalizeKey(nombre);
  if (!key) return null;
  return index.get(key) || index.get(ALIASES[key] || '') || null;
}

async function collectOrphanNames(connection) {
  const [routineRows] = await connection.query(
    `SELECT DISTINCT TRIM(nombre) AS nombre
     FROM ejercicios
     WHERE exercise_id IS NULL AND TRIM(nombre) <> ''`,
  );
  const [templateRows] = await connection.query(
    `SELECT DISTINCT TRIM(nombre) AS nombre
     FROM template_exercises
     WHERE exercise_id IS NULL AND TRIM(nombre) <> ''`,
  );
  // Also re-link lines pointing at non-GIF globals (bad reimports)
  const [badLinked] = await connection.query(
    `SELECT DISTINCT TRIM(e.nombre) AS nombre
     FROM ejercicios e
     INNER JOIN exercises c ON c.id = e.exercise_id
     WHERE c.created_by_trainer_id IS NULL
       AND (c.local_media_path IS NULL OR TRIM(c.local_media_path) = '')`,
  );
  const [badTpl] = await connection.query(
    `SELECT DISTINCT TRIM(te.nombre) AS nombre
     FROM template_exercises te
     INNER JOIN exercises c ON c.id = te.exercise_id
     WHERE c.created_by_trainer_id IS NULL
       AND (c.local_media_path IS NULL OR TRIM(c.local_media_path) = '')`,
  );

  const names = new Set();
  for (const row of [...routineRows, ...templateRows, ...badLinked, ...badTpl]) {
    if (row.nombre) names.add(row.nombre);
  }
  return [...names];
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  console.log(flags.dryRun
    ? '[backfill] Dry-run (pasa --confirm para escribir).'
    : '[backfill] CONFIRM — solo catálogo con GIF local.');

  const connection = await pool.getConnection();
  let linked = 0;
  let unresolved = [];
  let deletedBad = 0;

  try {
    const index = await loadGifCatalogIndex(connection);
    console.log(`[backfill] Catálogo con GIF: ${index.size} claves`);

    const names = await collectOrphanNames(connection);
    console.log(`[backfill] Nombres a religar: ${names.length}`);

    for (const nombre of names) {
      const match = resolveMatch(nombre, index);
      if (!match) {
        unresolved.push(nombre);
        console.log(`  ✗ sin GIF en catálogo: "${nombre}"`);
        continue;
      }

      if (flags.dryRun) {
        console.log(`  · dry-run "${nombre}" → #${match.id} ${match.name_es || match.name}`);
        linked += 1;
        continue;
      }

      const [r1] = await connection.query(
        `UPDATE ejercicios SET exercise_id = ?
         WHERE TRIM(nombre) = ?
           AND (
             exercise_id IS NULL
             OR exercise_id IN (
               SELECT id FROM (
                 SELECT id FROM exercises
                 WHERE created_by_trainer_id IS NULL
                   AND (local_media_path IS NULL OR TRIM(local_media_path) = '')
               ) bad
             )
           )`,
        [match.id, nombre],
      );
      const [r2] = await connection.query(
        `UPDATE template_exercises SET exercise_id = ?
         WHERE TRIM(nombre) = ?
           AND (
             exercise_id IS NULL
             OR exercise_id IN (
               SELECT id FROM (
                 SELECT id FROM exercises
                 WHERE created_by_trainer_id IS NULL
                   AND (local_media_path IS NULL OR TRIM(local_media_path) = '')
               ) bad
             )
           )`,
        [match.id, nombre],
      );
      const n = (r1.affectedRows || 0) + (r2.affectedRows || 0);
      linked += n;
      console.log(`  ✓ "${nombre}" → #${match.id} ${match.name_es || match.name} (${n} filas)`);
    }

    // Remove accidental GitHub-only reimports (safe: FK SET NULL; we already remapped)
    if (!flags.dryRun) {
      const [del] = await connection.query(
        `DELETE FROM exercises
         WHERE created_by_trainer_id IS NULL
           AND (local_media_path IS NULL OR TRIM(local_media_path) = '')
           AND media_url LIKE 'https://raw.githubusercontent.com/wrkout/%'`,
      );
      deletedBad = del.affectedRows || 0;
    } else {
      const [c] = await connection.query(
        `SELECT COUNT(*) AS n FROM exercises
         WHERE created_by_trainer_id IS NULL
           AND (local_media_path IS NULL OR TRIM(local_media_path) = '')
           AND media_url LIKE 'https://raw.githubusercontent.com/wrkout/%'`,
      );
      deletedBad = Number(c[0]?.n) || 0;
      console.log(`[backfill] dry-run borraría ${deletedBad} globales wrkout sin GIF`);
    }

    console.log('[backfill] Resumen');
    console.log(`  vínculos:        ${linked}`);
    console.log(`  sin match GIF:  ${unresolved.length}`);
    console.log(`  wrkout sin GIF: ${deletedBad} ${flags.dryRun ? '(dry-run)' : 'eliminados'}`);
    if (unresolved.length) {
      unresolved.forEach((n) => console.log(`    - ${n}`));
      console.log('  → Reasigna esos nombres desde el catálogo (ejercicios con GIF) en Programación.');
    }
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[backfill] Error:', err.message || err);
  process.exit(1);
});
