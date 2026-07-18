-- Feature 041: récords personales (PRs) detectados al cerrar sesión
CREATE TABLE IF NOT EXISTS personal_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    exercise_id INT NULL,
    exercise_name VARCHAR(150) NOT NULL,
    weight DECIMAL(6,2) NOT NULL,
    reps INT NOT NULL,
    achieved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id INT NULL,
    set_log_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_personal_records_client_name (client_id, exercise_name),
    INDEX idx_personal_records_client_exercise (client_id, exercise_id),
    INDEX idx_personal_records_achieved (client_id, achieved_at),
    CONSTRAINT fk_personal_records_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_personal_records_session
      FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE SET NULL,
    CONSTRAINT fk_personal_records_set_log
      FOREIGN KEY (set_log_id) REFERENCES workout_set_logs(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Ampliar tipos de notificación in-app (041 / 042)
ALTER TABLE notifications
  MODIFY COLUMN type ENUM(
    'routine_assigned',
    'routine_completed',
    'system',
    'pr_achieved',
    'streak_milestone',
    'streak_at_risk'
  ) NOT NULL DEFAULT 'system';
