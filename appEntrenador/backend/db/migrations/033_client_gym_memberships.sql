-- Feature 082: membresía del gym físico (recordatorio personal del cliente)
CREATE TABLE IF NOT EXISTS client_gym_memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  gym_name VARCHAR(120) NULL,
  expires_on DATE NOT NULL,
  notify_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_client_gym_memberships_client (client_id),
  INDEX idx_client_gym_memberships_expires (expires_on),
  CONSTRAINT fk_client_gym_memberships_client
    FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Ampliar ENUM de notificaciones (idempotente en installs nuevas vía ensure)
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
    'membership_expired',
    'membership_grace',
    'gym_membership_expiring',
    'gym_membership_expired'
  ) NOT NULL DEFAULT 'system';
