const db = require('../config/db');

const NOTIFICATION_TYPES_ENUM = `
  'routine_assigned',
  'routine_completed',
  'system',
  'pr_achieved',
  'streak_milestone',
  'streak_at_risk',
  'diet_updated'
`;

/**
 * Asegura la tabla notifications en DBs ya existentes (script_db.sql no se re-ejecuta).
 * Feature 025 + 041/042 + 074 (deep-links / TTL / diet_updated).
 */
async function ensureNotificationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      type ENUM(
        ${NOTIFICATION_TYPES_ENUM}
      ) NOT NULL DEFAULT 'system',
      entity_type VARCHAR(50) NULL,
      entity_id INT NULL,
      action_url VARCHAR(255) NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL,
      INDEX idx_notifications_user (user_id),
      INDEX idx_notifications_unread (user_id, is_read),
      INDEX idx_notifications_expires (user_id, expires_at),
      INDEX idx_notifications_read_created (user_id, is_read, created_at),
      CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await ensureColumn('entity_type', 'VARCHAR(50) NULL AFTER type');
  await ensureColumn('entity_id', 'INT NULL AFTER entity_type');
  await ensureColumn('action_url', 'VARCHAR(255) NULL AFTER entity_id');
  await ensureColumn('expires_at', 'TIMESTAMP NULL AFTER created_at');

  try {
    await db.query(`
      ALTER TABLE notifications
        MODIFY COLUMN type ENUM(
          ${NOTIFICATION_TYPES_ENUM}
        ) NOT NULL DEFAULT 'system'
    `);
  } catch (error) {
    if (error.code !== 'ER_NO_SUCH_TABLE') {
      console.warn('ensureNotificationsTable: no se pudo ampliar ENUM type:', error.message);
    }
  }

  try {
    await db.query(`
      UPDATE notifications
      SET expires_at = DATE_ADD(created_at, INTERVAL 30 DAY)
      WHERE expires_at IS NULL
    `);
  } catch (error) {
    console.warn('ensureNotificationsTable: backfill expires_at falló:', error.message);
  }

  await ensureIndex('idx_notifications_expires', '(user_id, expires_at)');
  await ensureIndex('idx_notifications_read_created', '(user_id, is_read, created_at)');
}

async function ensureColumn(columnName, definition) {
  try {
    const [rows] = await db.query(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'notifications'
         AND COLUMN_NAME = ?`,
      [columnName],
    );
    if (rows.length) return;
    await db.query(`ALTER TABLE notifications ADD COLUMN ${columnName} ${definition}`);
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME' && error.code !== 'ER_NO_SUCH_TABLE') {
      console.warn(`ensureNotificationsTable: no se pudo añadir ${columnName}:`, error.message);
    }
  }
}

async function ensureIndex(indexName, columnsSql) {
  try {
    const [rows] = await db.query(
      `SELECT INDEX_NAME
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'notifications'
         AND INDEX_NAME = ?`,
      [indexName],
    );
    if (rows.length) return;
    await db.query(`CREATE INDEX ${indexName} ON notifications ${columnsSql}`);
  } catch (error) {
    if (error.code !== 'ER_DUP_KEYNAME' && error.code !== 'ER_NO_SUCH_TABLE') {
      console.warn(`ensureNotificationsTable: no se pudo crear índice ${indexName}:`, error.message);
    }
  }
}

module.exports = { ensureNotificationsTable };
