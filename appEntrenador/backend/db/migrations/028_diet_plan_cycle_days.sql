-- Feature 064: ciclo multi-semana en planes de dieta
-- diet_plans += cycle_* ; diet_plan_days ; diet_meals → diet_day_id
--
-- NOTA: el backfill idempotente (copiar meals a L–D semana 1) vive en
-- backend/src/db/ensureDietPlansTables.js. Al clonar meals temporales debe
-- incluirse diet_plan_id mientras exista fk_diet_meals_plan.

-- 1) Campos de ciclo en diet_plans
ALTER TABLE diet_plans
  ADD COLUMN cycle_length_weeks TINYINT NOT NULL DEFAULT 4
    AFTER is_active,
  ADD COLUMN cycle_start_date DATE NULL
    AFTER cycle_length_weeks;

UPDATE diet_plans
SET cycle_start_date = DATE(created_at)
WHERE cycle_start_date IS NULL;

UPDATE diet_plans
SET cycle_start_date = DATE_SUB(
  cycle_start_date,
  INTERVAL WEEKDAY(cycle_start_date) DAY
)
WHERE cycle_start_date IS NOT NULL;

ALTER TABLE diet_plans
  MODIFY COLUMN cycle_start_date DATE NOT NULL;

-- 2) Días del ciclo
CREATE TABLE IF NOT EXISTS diet_plan_days (
    id INT AUTO_INCREMENT PRIMARY KEY,
    diet_plan_id INT NOT NULL,
    week_index TINYINT NOT NULL,
    dia_semana ENUM('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo') NOT NULL,
    notes TEXT NULL,
    calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
    protein_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
    carbs_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fats_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
    UNIQUE KEY uq_diet_plan_day (diet_plan_id, week_index, dia_semana),
    INDEX idx_diet_plan_days_plan (diet_plan_id),
    CONSTRAINT fk_diet_plan_days_plan
      FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3) diet_meals → diet_day_id (nullable durante backfill vía ensure)
ALTER TABLE diet_meals
  ADD COLUMN diet_day_id INT NULL AFTER diet_plan_id;
