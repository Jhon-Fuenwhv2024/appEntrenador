const db = require('../config/db');

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.cnt) > 0;
}

/**
 * Asegura columnas SaaS B2B en DBs ya existentes (script_db.sql no se re-ejecuta).
 * Feature 036 / 037 Fase 1.
 */
async function ensureSaasColumns() {
  if (!(await columnExists('usuarios', 'is_superadmin'))) {
    await db.query(
      `ALTER TABLE usuarios
       ADD COLUMN is_superadmin BOOLEAN NOT NULL DEFAULT FALSE`,
    );
  }

  if (!(await columnExists('trainers_info', 'saas_plan'))) {
    await db.query(
      `ALTER TABLE trainers_info
       ADD COLUMN saas_plan ENUM('FREE', 'PRO') NOT NULL DEFAULT 'FREE'`,
    );
  }

  if (!(await columnExists('trainers_info', 'saas_expiration_date'))) {
    await db.query(
      `ALTER TABLE trainers_info
       ADD COLUMN saas_expiration_date DATE NULL`,
    );
  }
}

module.exports = { ensureSaasColumns };
