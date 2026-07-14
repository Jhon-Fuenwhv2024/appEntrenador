/**
 * One-shot: create routine_templates + template_exercises if missing.
 * Usage: node scripts/createRoutineTemplatesTables.js
 */
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function main() {
  const sqlPath = path.join(__dirname, '../db/migrations/005_routine_templates.sql');
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
      console.log('[createRoutineTemplatesTables] OK:', statement.slice(0, 48).replace(/\s+/g, ' '), '...');
    }
    console.log('[createRoutineTemplatesTables] Tablas listas.');
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[createRoutineTemplatesTables] Error:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
