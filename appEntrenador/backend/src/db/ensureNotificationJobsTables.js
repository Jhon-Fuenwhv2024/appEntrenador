const db = require('../config/db');

/**
 * Asegura tablas de settings + dedupe para jobs de notificaciones (Feature 075).
 */
async function ensureNotificationJobsTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS client_notification_settings (
      client_id INT NOT NULL,
      workout_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      workout_reminder_hour TINYINT NOT NULL DEFAULT 8,
      timezone VARCHAR(64) NOT NULL DEFAULT 'America/Bogota',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (client_id),
      CONSTRAINT fk_client_notification_settings_client
        FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS notification_dedupe (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      dedupe_key VARCHAR(80) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_notification_dedupe_user_key (user_id, dedupe_key),
      INDEX idx_notification_dedupe_created (created_at),
      CONSTRAINT fk_notification_dedupe_user
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
}

module.exports = { ensureNotificationJobsTables };
