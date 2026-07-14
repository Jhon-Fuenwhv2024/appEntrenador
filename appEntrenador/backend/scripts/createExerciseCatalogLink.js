/**
 * One-shot: add exercise_id FK on ejercicios + template_exercises (Feature 022).
 * Usage: node scripts/createExerciseCatalogLink.js
 */
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function main() {
  const sqlPath = path.join(__dirname, '../db/migrations/008_exercise_catalog_link.sql');
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
    for (const statement of statements) {
      await connection.query(statement);
      console.log('[createExerciseCatalogLink] OK:', statement.slice(0, 56).replace(/\s+/g, ' '), '...');
    }
    console.log('[createExerciseCatalogLink] Columnas exercise_id listas.');
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[createExerciseCatalogLink] Error:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
