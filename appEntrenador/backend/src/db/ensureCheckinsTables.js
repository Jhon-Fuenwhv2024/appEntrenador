const db = require('../config/db');

/**
 * Asegura tablas weekly_checkins / progress_photos en DBs ya existentes.
 * Feature 033.
 */
async function ensureCheckinsTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS weekly_checkins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      created_at DATE NOT NULL,
      sleep_quality TINYINT NOT NULL,
      stress_level TINYINT NOT NULL,
      diet_adherence TINYINT NOT NULL,
      notes TEXT NULL,
      INDEX idx_weekly_checkins_client (client_id),
      INDEX idx_weekly_checkins_created (created_at),
      CONSTRAINT fk_weekly_checkins_client
        FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      CONSTRAINT chk_weekly_checkins_sleep
        CHECK (sleep_quality BETWEEN 1 AND 5),
      CONSTRAINT chk_weekly_checkins_stress
        CHECK (stress_level BETWEEN 1 AND 5),
      CONSTRAINT chk_weekly_checkins_diet
        CHECK (diet_adherence BETWEEN 1 AND 5)
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS progress_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      checkin_id INT NULL,
      image_url VARCHAR(512) NOT NULL,
      pose_type ENUM('front', 'side', 'back') NOT NULL,
      taken_at DATE NOT NULL,
      INDEX idx_progress_photos_client (client_id),
      INDEX idx_progress_photos_checkin (checkin_id),
      INDEX idx_progress_photos_pose (pose_type),
      CONSTRAINT fk_progress_photos_client
        FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      CONSTRAINT fk_progress_photos_checkin
        FOREIGN KEY (checkin_id) REFERENCES weekly_checkins(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);
}

module.exports = { ensureCheckinsTables };
