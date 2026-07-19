/**
 * One-shot: create `exercises` table if missing (uses same pool as the app).
 * Usage: node scripts/createExercisesTable.js
 */
const pool = require('../src/config/db');

const DDL = `
CREATE TABLE IF NOT EXISTS exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    name_es VARCHAR(150) NULL,
    description TEXT NULL,
    description_es TEXT NULL,
    target_muscle VARCHAR(100) NOT NULL,
    target_muscle_es VARCHAR(100) NULL,
    primary_muscle VARCHAR(100) NULL,
    secondary_muscles JSON NULL,
    is_warmup TINYINT(1) NOT NULL DEFAULT 0,
    media_type ENUM('image', 'gif', 'youtube', 'video', 'none') NOT NULL DEFAULT 'none',
    media_url VARCHAR(500) NULL,
    local_media_path VARCHAR(500) NULL,
    created_by_trainer_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_exercises_name (name),
    INDEX idx_exercises_trainer (created_by_trainer_id),
    CONSTRAINT fk_exercises_trainer
      FOREIGN KEY (created_by_trainer_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB
`;

async function main() {
  const connection = await pool.getConnection();
  try {
    await connection.query(DDL);
    const [rows] = await connection.query('SHOW TABLES LIKE ?', ['exercises']);
    if (rows.length === 0) {
      throw new Error('La tabla exercises no aparece tras CREATE TABLE.');
    }
    console.log('[createExercisesTable] Tabla exercises lista (CREATE IF NOT EXISTS).');
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[createExercisesTable] Error:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
