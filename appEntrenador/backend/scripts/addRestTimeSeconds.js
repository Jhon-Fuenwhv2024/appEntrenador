/**
 * One-shot: add rest_time_seconds to ejercicios + template_exercises if missing.
 * Usage: node scripts/addRestTimeSeconds.js
 * (or npm run db:add-rest-time from backend/)
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
  const sqlPath = path.join(__dirname, '../db/migrations/012_rest_time_seconds.sql');
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
    const targets = [
      { table: 'ejercicios', column: 'rest_time_seconds' },
      { table: 'template_exercises', column: 'rest_time_seconds' },
    ];

    for (const { table, column } of targets) {
      if (await columnExists(connection, table, column)) {
        console.log(`[addRestTimeSeconds] ${table}.${column} ya existe — omitido.`);
      }
    }

    for (const statement of statements) {
      const match = statement.match(/ALTER TABLE\s+(\w+)/i);
      const table = match?.[1];
      if (table && await columnExists(connection, table, 'rest_time_seconds')) {
        continue;
      }
      await connection.query(statement);
      console.log('[addRestTimeSeconds] OK:', statement.slice(0, 56).replace(/\s+/g, ' '), '...');
    }
    console.log('[addRestTimeSeconds] Columnas listas.');
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[addRestTimeSeconds] Error:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
