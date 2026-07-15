/** Inspect recent ejercicios.superset_letter values. */
const pool = require('../src/config/db');

async function main() {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ejercicios'
       AND COLUMN_NAME = 'superset_letter'`,
  );
  console.log('column exists:', cols.length > 0);

  const [rows] = await pool.query(
    `SELECT id, rutina_id, nombre, series, superset_letter
     FROM ejercicios
     ORDER BY id DESC
     LIMIT 20`,
  );
  console.log(JSON.stringify(rows, null, 2));

  const withLetter = rows.filter((r) => r.superset_letter != null);
  console.log('with letter among last 20:', withLetter.length);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
