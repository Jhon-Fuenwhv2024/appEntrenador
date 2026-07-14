-- Feature 020: ensure alumnos_info exists (1:1 with usuarios)
CREATE TABLE IF NOT EXISTS alumnos_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    telefono VARCHAR(20) NULL,
    fecha_nacimiento DATE NULL,
    sexo ENUM('Masculino', 'Femenino', 'Otro') NULL,
    lesiones TEXT NULL,
    objetivo VARCHAR(100) NULL,
    foto_url VARCHAR(255) NULL,
    ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_alumnos_info_user (user_id),
    CONSTRAINT fk_alumnos_info_user
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Soften legacy NOT NULL columns if the table already existed
ALTER TABLE alumnos_info
  MODIFY COLUMN telefono VARCHAR(20) NULL,
  MODIFY COLUMN fecha_nacimiento DATE NULL,
  MODIFY COLUMN sexo ENUM('Masculino', 'Femenino', 'Otro') NULL,
  MODIFY COLUMN objetivo VARCHAR(100) NULL,
  MODIFY COLUMN foto_url VARCHAR(255) NULL;
