const db = require('../config/db');

/**
 * Feature 083: tabla refresh_tokens (sesión persistente).
 */
async function ensureRefreshTokensTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME NULL,
      replaced_by_id BIGINT NULL,
      user_agent VARCHAR(512) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME NULL,
      UNIQUE KEY uq_refresh_tokens_hash (token_hash),
      INDEX idx_refresh_tokens_user_active (user_id, revoked_at),
      INDEX idx_refresh_tokens_expires (expires_at),
      CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
}

module.exports = { ensureRefreshTokensTable };
