-- Feature 079: tipos de membresía por trainer + precio en membresía alumno
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
) ENGINE=InnoDB;
