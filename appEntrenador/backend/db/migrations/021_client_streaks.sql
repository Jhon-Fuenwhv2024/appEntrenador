-- Feature 042: rachas y meta semanal de consistencia
CREATE TABLE IF NOT EXISTS client_streaks (
    client_id INT NOT NULL,
    current_streak INT NOT NULL DEFAULT 0,
    best_streak INT NOT NULL DEFAULT 0,
    week_goal INT NOT NULL DEFAULT 3,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (client_id),
    CONSTRAINT fk_client_streaks_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_client_streaks_week_goal
      CHECK (week_goal >= 1 AND week_goal <= 14)
) ENGINE=InnoDB;
