const db = require('../config/db');

/**
 * Asegura tabla client_memberships en DBs ya existentes.
 * Feature 040.
 */
async function ensureClientMembershipsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS client_memberships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      status ENUM('active', 'owing', 'expired') NOT NULL DEFAULT 'active',
      period_start DATE NULL,
      period_end DATE NULL,
      notes TEXT NULL,
      block_on_unpaid BOOLEAN NOT NULL DEFAULT FALSE,
      updated_by INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_client_memberships_client (client_id),
      INDEX idx_client_memberships_status (status),
      INDEX idx_client_memberships_period_end (period_end),
      CONSTRAINT fk_client_memberships_client
        FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      CONSTRAINT fk_client_memberships_updated_by
        FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);
}

module.exports = { ensureClientMembershipsTable };
