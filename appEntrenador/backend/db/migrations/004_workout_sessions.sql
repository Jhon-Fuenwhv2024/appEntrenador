-- Feature 012: workout session logs (ejecución vs prescripción)

CREATE TABLE IF NOT EXISTS workout_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    routine_id INT NULL,
    routine_name VARCHAR(100) NOT NULL,
    started_at DATETIME NULL,
    finished_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('completed', 'abandoned') NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workout_sessions_client (client_id),
    INDEX idx_workout_sessions_finished (finished_at),
    CONSTRAINT fk_workout_sessions_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_workout_sessions_routine
      FOREIGN KEY (routine_id) REFERENCES rutinas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workout_set_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    exercise_id INT NULL,
    exercise_name VARCHAR(150) NOT NULL,
    set_number INT NOT NULL,
    weight DECIMAL(6,2) NOT NULL,
    reps INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workout_set_logs_session (session_id),
    CONSTRAINT fk_workout_set_logs_session
      FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_workout_set_logs_exercise
      FOREIGN KEY (exercise_id) REFERENCES ejercicios(id) ON DELETE SET NULL
) ENGINE=InnoDB;
