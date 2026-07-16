/**
 * One-shot: añade is_superadmin + planes SaaS si faltan.
 * Usage: node scripts/addSaasSuperadminAndPlans.js
 * (o npm run db:add-saas-plans desde backend/)
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
  const sqlPath = path.join(__dirname, '../db/migrations/018_saas_superadmin_and_plans.sql');
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
      if (/ALTER TABLE\s+usuarios/i.test(statement)) {
        if (await columnExists(connection, 'usuarios', 'is_superadmin')) {
          console.log('[addSaasSuperadminAndPlans] usuarios.is_superadmin ya existe — omitido.');
          continue;
        }
      }

      if (/ALTER TABLE\s+trainers_info/i.test(statement)) {
        const hasPlan = await columnExists(connection, 'trainers_info', 'saas_plan');
        const hasExp = await columnExists(connection, 'trainers_info', 'saas_expiration_date');
        if (hasPlan && hasExp) {
          console.log('[addSaasSuperadminAndPlans] trainers_info.saas_* ya existen — omitido.');
          continue;
        }
        // Si solo falta una, aplicar ALTERs individuales seguros
        if (!hasPlan) {
          await connection.query(
            `ALTER TABLE trainers_info
             ADD COLUMN saas_plan ENUM('FREE', 'PRO') NOT NULL DEFAULT 'FREE'`,
          );
          console.log('[addSaasSuperadminAndPlans] OK: trainers_info.saas_plan');
        }
        if (!hasExp) {
          await connection.query(
            `ALTER TABLE trainers_info
             ADD COLUMN saas_expiration_date DATE NULL`,
          );
          console.log('[addSaasSuperadminAndPlans] OK: trainers_info.saas_expiration_date');
        }
        continue;
      }

      await connection.query(statement);
      console.log(
        '[addSaasSuperadminAndPlans] OK:',
        statement.slice(0, 72).replace(/\s+/g, ' '),
        '...',
      );
    }
    console.log('[addSaasSuperadminAndPlans] Columnas SaaS listas.');
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[addSaasSuperadminAndPlans] Error:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
