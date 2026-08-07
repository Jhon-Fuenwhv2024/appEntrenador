const db = require('../config/db');

/**
 * Asegura columna shadow_mode_enabled en client_notification_settings (Feature 076).
 */
async function ensureShadowModeColumn() {
  const [columns] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'client_notification_settings'
       AND COLUMN_NAME = 'shadow_mode_enabled'
     LIMIT 1`,
  );

  if (columns.length > 0) return;

  await db.query(`
    ALTER TABLE client_notification_settings
      ADD COLUMN shadow_mode_enabled BOOLEAN NOT NULL DEFAULT TRUE
      AFTER timezone
  `);
}

module.exports = { ensureShadowModeColumn };
