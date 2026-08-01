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

async function constraintExists(name) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND CONSTRAINT_NAME = ?`,
    [name],
  );
  return Number(rows[0]?.cnt) > 0;
}

async function indexExists(table, indexName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?`,
    [table, indexName],
  );
  return Number(rows[0]?.cnt) > 0;
}

/**
 * Feature 079: catálogo de tipos de membresía + columnas de precio en client_memberships.
 */
async function ensureTrainerMembershipTypesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS trainer_membership_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trainer_id INT NOT NULL,
      name VARCHAR(120) NOT NULL,
      price DECIMAL(12, 2) NOT NULL,
      duration_days INT NOT NULL DEFAULT 30,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tmt_trainer (trainer_id),
      INDEX idx_tmt_trainer_active (trainer_id, is_active),
      CONSTRAINT fk_tmt_trainer
        FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  if (!(await columnExists('client_memberships', 'membership_type_id'))) {
    await db.query(`
      ALTER TABLE client_memberships
      ADD COLUMN membership_type_id INT NULL AFTER client_id
    `);
  }

  if (!(await columnExists('client_memberships', 'plan_price'))) {
    await db.query(`
      ALTER TABLE client_memberships
      ADD COLUMN plan_price DECIMAL(12, 2) NULL AFTER notes
    `);
  }

  if (!(await columnExists('client_memberships', 'amount_paid'))) {
    await db.query(`
      ALTER TABLE client_memberships
      ADD COLUMN amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER plan_price
    `);
  }

  if (!(await indexExists('client_memberships', 'idx_cm_membership_type'))) {
    await db.query(`
      ALTER TABLE client_memberships
      ADD INDEX idx_cm_membership_type (membership_type_id)
    `);
  }

  if (!(await constraintExists('fk_cm_membership_type'))) {
    await db.query(`
      ALTER TABLE client_memberships
      ADD CONSTRAINT fk_cm_membership_type
        FOREIGN KEY (membership_type_id)
        REFERENCES trainer_membership_types(id)
        ON DELETE SET NULL
    `);
  }
}

module.exports = { ensureTrainerMembershipTypesTable };
