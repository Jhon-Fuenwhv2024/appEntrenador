-- Feature 024: perfil extendido del entrenador (1:1 con usuarios)
CREATE TABLE IF NOT EXISTS trainers_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    telefono VARCHAR(20) NULL,
    foto_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_trainers_info_user (user_id),
    CONSTRAINT fk_trainers_info_user
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;
