-- Feature 032: hábitos diarios (checklist trainer → client)
-- logged_date se almacena como DATE civil (YYYY-MM-DD) sin conversión UTC.

CREATE TABLE IF NOT EXISTS habits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    trainer_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_habits_client (client_id),
    INDEX idx_habits_trainer (trainer_id),
    CONSTRAINT fk_habits_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_habits_trainer
      FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS habit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    habit_id INT NOT NULL,
    logged_date DATE NOT NULL,
    UNIQUE KEY uq_habit_logs_habit_date (habit_id, logged_date),
    INDEX idx_habit_logs_date (logged_date),
    CONSTRAINT fk_habit_logs_habit
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
) ENGINE=InnoDB;
