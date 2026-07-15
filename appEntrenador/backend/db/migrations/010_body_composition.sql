-- Feature 026: historial de composición corporal (antropometría fechada)
CREATE TABLE IF NOT EXISTS body_composition_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    recorded_by INT NOT NULL,
    measured_at DATE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    height_cm DECIMAL(5,2) NOT NULL,
    body_fat_pct DECIMAL(5,2) NULL,
    bmi DECIMAL(5,2) NULL,
    chest_cm DECIMAL(5,2) NULL,
    waist_cm DECIMAL(5,2) NULL,
    triceps_cm DECIMAL(5,2) NULL,
    biceps_cm DECIMAL(5,2) NULL,
    glutes_cm DECIMAL(5,2) NULL,
    quads_cm DECIMAL(5,2) NULL,
    calves_cm DECIMAL(5,2) NULL,
    back_cm DECIMAL(5,2) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bcl_client_measured (client_id, measured_at),
    CONSTRAINT fk_bcl_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_bcl_recorder
      FOREIGN KEY (recorded_by) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
