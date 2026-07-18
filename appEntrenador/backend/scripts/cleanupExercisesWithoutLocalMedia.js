/**
 * Feature 044 — Limpia globales wrkout sin media local (solo imagen GitHub).
 *
 * Conserva ejercicios con local_media_path (GIF Fitcron hosteado).
 * FK ejercicio_id en rutinas/plantillas: ON DELETE SET NULL (historial intacto).
 *
 * Usage (desde backend/):
 *   node scripts/cleanupExercisesWithoutLocalMedia.js --dry-run
 *   node scripts/cleanupExercisesWithoutLocalMedia.js --confirm
 *
 * Requiere --confirm para borrar de verdad (seguridad).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = require('../src/config/db');

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run') || !argv.includes('--confirm'),
    confirm: argv.includes('--confirm'),
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (!flags.confirm) {
    console.log('[cleanup] Modo dry-run (pasa --confirm para borrar).');
  }

  const connection = await pool.getConnection();
  try {
    const [keepRows] = await connection.query(`
      SELECT COUNT(*) AS n FROM exercises
      WHERE created_by_trainer_id IS NULL
        AND local_media_path IS NOT NULL
        AND TRIM(local_media_path) <> ''
    `);
    const [deleteCandidates] = await connection.query(`
      SELECT id, name, name_es, media_type, media_url
      FROM exercises
      WHERE created_by_trainer_id IS NULL
        AND (local_media_path IS NULL OR TRIM(local_media_path) = '')
      ORDER BY name ASC
    `);
    const [privateCount] = await connection.query(`
      SELECT COUNT(*) AS n FROM exercises
      WHERE created_by_trainer_id IS NOT NULL
    `);

    const keep = Number(keepRows[0]?.n) || 0;
    const toDelete = deleteCandidates.length;
    const privateN = Number(privateCount[0]?.n) || 0;

    console.log('[cleanup] Globales CON media local (se conservan):', keep);
    console.log('[cleanup] Globales SIN media local (candidatos):', toDelete);
    console.log('[cleanup] Privados trainer (no se tocan):', privateN);
    console.log('[cleanup] Muestra a borrar (máx 12):');
    for (const row of deleteCandidates.slice(0, 12)) {
      console.log(`  #${row.id} ${row.name} [${row.media_type}]`);
    }

    if (!flags.confirm || flags.dryRun) {
      console.log('\n[cleanup] Dry-run OK. Nada borrado.');
      console.log('Para ejecutar: node scripts/cleanupExercisesWithoutLocalMedia.js --confirm');
      return;
    }

    const [result] = await connection.query(`
      DELETE FROM exercises
      WHERE created_by_trainer_id IS NULL
        AND (local_media_path IS NULL OR TRIM(local_media_path) = '')
    `);

    console.log(`\n[cleanup] Borrados: ${result.affectedRows}`);
    console.log(`[cleanup] Globales restantes (con GIF local): ${keep}`);
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[cleanup] Error:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
