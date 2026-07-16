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

async function tableExists(table) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [table],
  );
  return Number(rows[0]?.cnt) > 0;
}

/**
 * Asegura columnas SaaS B2B en DBs ya existentes (script_db.sql no se re-ejecuta).
 * Feature 037 Fase 1.
 */
async function ensureSaasColumns() {
  if (!(await tableExists('usuarios'))) {
    throw new Error('Tabla usuarios no existe; importa script_db.sql primero.');
  }

  if (!(await tableExists('trainers_info'))) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS trainers_info (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        telefono VARCHAR(20) NULL,
        foto_url VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_trainers_info_user (user_id),
        CONSTRAINT fk_trainers_info_user
          FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

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
