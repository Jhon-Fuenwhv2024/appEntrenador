/**
 * One-shot: add Feature 044 columns to `exercises` if missing.
 * Usage: node scripts/addExercisesI18n.js
 * (or npm run db:add-exercises-i18n from backend/)
 */
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

const COLUMNS = [
  'name_es',
  'description_es',
  'local_media_path',
  'target_muscle_es',
];

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.cnt) > 0;
}

async function main() {
  const sqlPath = path.join(
    __dirname,
    '../db/migrations/024_exercises_i18n_local_media.sql',
  );
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .trim())
    .filter((s) => s.length > 0);

  const connection = await pool.getConnection();
  try {
    for (const column of COLUMNS) {
      if (await columnExists(connection, 'exercises', column)) {
        console.log(`[addExercisesI18n] exercises.${column} ya existe — omitido.`);
      }
    }

    for (const statement of statements) {
      const match = statement.match(/ADD COLUMN\s+(\w+)/i);
      const column = match?.[1];
      if (column && await columnExists(connection, 'exercises', column)) {
        continue;
      }
      await connection.query(statement);
      console.log(
        '[addExercisesI18n] OK:',
        statement.slice(0, 72).replace(/\s+/g, ' '),
        '...',
      );
    }
    console.log('[addExercisesI18n] Columnas listas.');
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[addExercisesI18n] Error:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
