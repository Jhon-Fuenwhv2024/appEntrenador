const db = require('../config/db');

/**
 * Asegura la tabla push_subscriptions (Feature 051).
 */
async function ensurePushSubscriptionsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      endpoint VARCHAR(2048) NOT NULL,
      p256dh VARCHAR(255) NOT NULL,
      auth VARCHAR(255) NOT NULL,
      user_agent VARCHAR(512) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_push_subscriptions_endpoint (endpoint(768)),
      INDEX idx_push_subscriptions_user (user_id),
      CONSTRAINT fk_push_subscriptions_user
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  // Widen endpoint if an older 512 install exists (MySQL/TiDB).
  try {
    await db.query(`
      ALTER TABLE push_subscriptions
        MODIFY COLUMN endpoint VARCHAR(2048) NOT NULL
    `);
  } catch (error) {
    if (error.code !== 'ER_NO_SUCH_TABLE') {
      console.warn('ensurePushSubscriptionsTable: widen endpoint:', error.message);
    }
  }
}

module.exports = { ensurePushSubscriptionsTable };
