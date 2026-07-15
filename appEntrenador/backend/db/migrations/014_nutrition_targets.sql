-- Feature 031: objetivos nutricionales diarios (1:1 con el cliente)
CREATE TABLE IF NOT EXISTS nutrition_targets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    trainer_id INT NOT NULL,
    calories INT NOT NULL,
    protein_g INT NOT NULL,
    carbs_g INT NOT NULL,
    fats_g INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_nutrition_targets_client (client_id),
    INDEX idx_nutrition_targets_trainer (trainer_id),
    CONSTRAINT fk_nutrition_targets_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_nutrition_targets_trainer
      FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
