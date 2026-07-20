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
 * Asegura email + columnas de reset en usuarios (Feature 056).
 */
async function ensureUsuariosEmailResetColumns() {
  if (!(await columnExists('usuarios', 'email'))) {
    await db.query(
      `ALTER TABLE usuarios
       ADD COLUMN email VARCHAR(255) NULL UNIQUE
         COMMENT 'Correo para recuperación de contraseña (Feature 056)'`,
    );
  }

  if (!(await columnExists('usuarios', 'reset_password_token'))) {
    await db.query(
      `ALTER TABLE usuarios
       ADD COLUMN reset_password_token VARCHAR(64) NULL
         COMMENT 'SHA-256 hex del token de reset (Feature 056)'`,
    );
  }

  if (!(await columnExists('usuarios', 'reset_password_expires'))) {
    await db.query(
      `ALTER TABLE usuarios
       ADD COLUMN reset_password_expires DATETIME NULL
         COMMENT 'Expiración del token de reset (Feature 056)'`,
    );
  }
}

module.exports = { ensureUsuariosEmailResetColumns };
