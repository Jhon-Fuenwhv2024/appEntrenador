/**
 * One-shot: add superset_letter to ejercicios + template_exercises if missing.
 * Usage: node scripts/addSupersetLetter.js
 */
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

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
  const sqlPath = path.join(__dirname, '../db/migrations/013_superset_letter.sql');
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
      const match = statement.match(/ALTER TABLE\s+(\w+)/i);
      const table = match?.[1];
      if (table && await columnExists(connection, table, 'superset_letter')) {
        console.log(`[addSupersetLetter] ${table}.superset_letter ya existe — omitido.`);
        continue;
      }
      await connection.query(statement);
      console.log('[addSupersetLetter] OK:', statement.slice(0, 56).replace(/\s+/g, ' '), '...');
    }
    console.log('[addSupersetLetter] Columnas listas.');
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[addSupersetLetter] Error:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
