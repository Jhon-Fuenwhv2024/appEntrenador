-- Feature 075: preferencias de recordatorio + dedupe de jobs de notificación
-- Nota: statements separados (compat TiDB / MySQL)

CREATE TABLE IF NOT EXISTS client_notification_settings (
    client_id INT NOT NULL,
    workout_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    workout_reminder_hour TINYINT NOT NULL DEFAULT 8,
    timezone VARCHAR(64) NOT NULL DEFAULT 'America/Bogota',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (client_id),
    CONSTRAINT fk_client_notification_settings_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_client_notification_settings_hour
      CHECK (workout_reminder_hour >= 0 AND workout_reminder_hour <= 23)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notification_dedupe (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    dedupe_key VARCHAR(80) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_notification_dedupe_user_key (user_id, dedupe_key),
    INDEX idx_notification_dedupe_created (created_at),
    CONSTRAINT fk_notification_dedupe_user
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE notifications
  MODIFY COLUMN type ENUM(
    'routine_assigned',
    'routine_completed',
    'system',
    'pr_achieved',
    'streak_milestone',
    'streak_at_risk',
    'diet_updated',
    'workout_reminder',
    'membership_expiring',
    'membership_expired'
  ) NOT NULL DEFAULT 'system';
