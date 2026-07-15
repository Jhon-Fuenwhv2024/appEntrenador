/**
 * One-shot: create body_composition_logs if missing.
 * Usage: node scripts/createBodyCompositionTable.js
 */
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function main() {
  const sqlPath = path.join(__dirname, '../db/migrations/010_body_composition.sql');
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
      console.log('[createBodyCompositionTable] OK:', statement.slice(0, 48).replace(/\s+/g, ' '), '...');
    }
    console.log('[createBodyCompositionTable] Tabla lista.');
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[createBodyCompositionTable] Error:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
