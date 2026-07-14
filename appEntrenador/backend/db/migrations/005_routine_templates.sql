-- Feature 018: biblioteca de plantillas de rutina (trainer-owned, deep copy al asignar)

CREATE TABLE IF NOT EXISTS routine_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_routine_templates_trainer (trainer_id),
    CONSTRAINT fk_routine_templates_trainer
      FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS template_exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    series INT NOT NULL,
    repeticiones INT NOT NULL,
    peso DECIMAL(6,2) NOT NULL,
    indicaciones TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    INDEX idx_template_exercises_template (template_id),
    CONSTRAINT fk_template_exercises_template
      FOREIGN KEY (template_id) REFERENCES routine_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB;
