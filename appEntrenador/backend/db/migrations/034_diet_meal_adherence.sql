-- Feature 083: adherencia Comí / No comí por comida del plan
CREATE TABLE IF NOT EXISTS diet_meal_adherence (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  diet_meal_id INT NOT NULL,
  local_date DATE NOT NULL,
  status ENUM('eaten', 'skipped') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_diet_meal_adherence_day (client_id, diet_meal_id, local_date),
  INDEX idx_diet_meal_adherence_client_date (client_id, local_date),
  CONSTRAINT fk_diet_meal_adherence_client
    FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_diet_meal_adherence_meal
    FOREIGN KEY (diet_meal_id) REFERENCES diet_meals(id) ON DELETE CASCADE
) ENGINE=InnoDB;
