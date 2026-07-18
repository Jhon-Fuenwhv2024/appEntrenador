const db = require('../config/db');

/**
 * Asegura tablas diet_plans / diet_meals / diet_items en DBs ya existentes.
 * Feature 043.
 */
async function ensureDietPlansTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS diet_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trainer_id INT NOT NULL,
      client_id INT NULL,
      title VARCHAR(150) NOT NULL,
      notes TEXT NULL,
      calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
      protein_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
      carbs_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
      fats_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_diet_plans_trainer (trainer_id),
      INDEX idx_diet_plans_client (client_id),
      INDEX idx_diet_plans_client_active (client_id, is_active),
      CONSTRAINT fk_diet_plans_trainer
        FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      CONSTRAINT fk_diet_plans_client
        FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS diet_meals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      diet_plan_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      time_hint VARCHAR(20) NULL,
      INDEX idx_diet_meals_plan (diet_plan_id),
      CONSTRAINT fk_diet_meals_plan
        FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS diet_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      diet_meal_id INT NOT NULL,
      food_name VARCHAR(150) NOT NULL,
      quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
      unit VARCHAR(50) NOT NULL DEFAULT 'g',
      calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
      protein_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
      carbs_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
      fats_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      INDEX idx_diet_items_meal (diet_meal_id),
      CONSTRAINT fk_diet_items_meal
        FOREIGN KEY (diet_meal_id) REFERENCES diet_meals(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
}

module.exports = { ensureDietPlansTables };
