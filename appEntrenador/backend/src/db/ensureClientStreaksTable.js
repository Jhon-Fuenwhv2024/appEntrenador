const db = require('../config/db');

/**
 * Asegura tabla client_streaks en DBs ya existentes.
 * Feature 042.
 */
async function ensureClientStreaksTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS client_streaks (
      client_id INT NOT NULL,
      current_streak INT NOT NULL DEFAULT 0,
      best_streak INT NOT NULL DEFAULT 0,
      week_goal INT NOT NULL DEFAULT 3,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (client_id),
      CONSTRAINT fk_client_streaks_client
        FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
}

module.exports = { ensureClientStreaksTable };
