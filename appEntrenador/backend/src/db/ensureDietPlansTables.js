const db = require('../config/db');

const DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.c) > 0;
}

async function tableExists(table) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS c
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [table],
  );
  return Number(rows[0]?.c) > 0;
}

async function constraintExists(name) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS c
     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND CONSTRAINT_NAME = ?`,
    [name],
  );
  return Number(rows[0]?.c) > 0;
}

async function dropForeignKeyIfExists(table, constraintName) {
  if (!(await constraintExists(constraintName))) return;
  try {
    await db.query(`ALTER TABLE ${table} DROP FOREIGN KEY ${constraintName}`);
  } catch {
    // ignore
  }
}

/**
 * Asegura tablas diet_plans / diet_plan_days / diet_meals / diet_items
 * y migra schema plano 043 → ciclo 064.
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
      cycle_length_weeks TINYINT NOT NULL DEFAULT 4,
      cycle_start_date DATE NOT NULL DEFAULT (CURRENT_DATE),
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

  if (!(await columnExists('diet_plans', 'cycle_length_weeks'))) {
    await db.query(`
      ALTER TABLE diet_plans
        ADD COLUMN cycle_length_weeks TINYINT NOT NULL DEFAULT 4
    `);
  }

  if (!(await columnExists('diet_plans', 'cycle_start_date'))) {
    await db.query(`
      ALTER TABLE diet_plans
        ADD COLUMN cycle_start_date DATE NULL
    `);
  }

  await db.query(`
    UPDATE diet_plans
    SET cycle_start_date = DATE(created_at)
    WHERE cycle_start_date IS NULL
  `);

  await db.query(`
    UPDATE diet_plans
    SET cycle_start_date = DATE_SUB(
      cycle_start_date,
      INTERVAL WEEKDAY(cycle_start_date) DAY
    )
    WHERE cycle_start_date IS NOT NULL
  `);

  try {
    await db.query(`
      ALTER TABLE diet_plans
        MODIFY COLUMN cycle_start_date DATE NOT NULL
    `);
  } catch {
    // already NOT NULL
  }

  await db.query(`
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
    ) ENGINE=InnoDB
  `);

  const mealsHasPlanId = await columnExists('diet_meals', 'diet_plan_id');
  const mealsHasDayId = await columnExists('diet_meals', 'diet_day_id');

  if (!(await tableExists('diet_meals'))) {
    await db.query(`
      CREATE TABLE diet_meals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        diet_day_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        time_hint VARCHAR(20) NULL,
        INDEX idx_diet_meals_day (diet_day_id),
        CONSTRAINT fk_diet_meals_day
          FOREIGN KEY (diet_day_id) REFERENCES diet_plan_days(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  } else if (!mealsHasDayId) {
    await db.query(`
      ALTER TABLE diet_meals
        ADD COLUMN diet_day_id INT NULL
    `);
  }

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

  // Migración 043 → 064 mientras exista diet_plan_id
  if (await columnExists('diet_meals', 'diet_plan_id')) {
    // Permitir clones durante backfill (diet_plan_id sigue NOT NULL + FK)
    await backfillLegacyMealsToWeek1();

    // Quitar FK/columna antigua ANTES de endurecer diet_day_id
    await dropForeignKeyIfExists('diet_meals', 'fk_diet_meals_plan');

    // Limpiar meals huérfanas sin día
    await db.query('DELETE FROM diet_meals WHERE diet_day_id IS NULL');

    try {
      await db.query('ALTER TABLE diet_meals DROP COLUMN diet_plan_id');
    } catch {
      // ignore
    }
  }

  if (await columnExists('diet_meals', 'diet_day_id')) {
    await db.query('DELETE FROM diet_meals WHERE diet_day_id IS NULL');

    try {
      await db.query(`
        ALTER TABLE diet_meals
          MODIFY COLUMN diet_day_id INT NOT NULL
      `);
    } catch {
      // ignore
    }

    if (!(await constraintExists('fk_diet_meals_day'))) {
      try {
        await db.query(`
          ALTER TABLE diet_meals
            ADD INDEX idx_diet_meals_day (diet_day_id)
        `);
      } catch {
        // index may exist
      }
      try {
        await db.query(`
          ALTER TABLE diet_meals
            ADD CONSTRAINT fk_diet_meals_day
              FOREIGN KEY (diet_day_id) REFERENCES diet_plan_days(id) ON DELETE CASCADE
        `);
      } catch {
        // fk may exist
      }
    }
  }
}

/**
 * Copia meals legacy a los 7 días de semana 1.
 * Idempotente: reanuda migraciones a medias.
 * IMPORTANTE: al clonar incluye diet_plan_id para no romper fk_diet_meals_plan.
 */
async function backfillLegacyMealsToWeek1() {
  const hasPlanId = await columnExists('diet_meals', 'diet_plan_id');
  const hasDayId = await columnExists('diet_meals', 'diet_day_id');
  if (!hasPlanId || !hasDayId) return;

  // Limpiar meals con plan inexistente (evitar FK al clonar)
  await db.query(`
    DELETE m FROM diet_meals m
    LEFT JOIN diet_plans p ON p.id = m.diet_plan_id
    WHERE m.diet_plan_id IS NOT NULL AND p.id IS NULL
  `);

  const [planRows] = await db.query(`
    SELECT DISTINCT diet_plan_id AS id
    FROM diet_meals
    WHERE diet_plan_id IS NOT NULL
  `);

  if (!planRows.length) return;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const row of planRows) {
      const planId = row.id;

      const [planExists] = await connection.query(
        'SELECT id FROM diet_plans WHERE id = ?',
        [planId],
      );
      if (!planExists.length) continue;

      const dayIds = [];
      for (const dia of DAYS) {
        const [existing] = await connection.query(
          `SELECT id FROM diet_plan_days
           WHERE diet_plan_id = ? AND week_index = 1 AND dia_semana = ?`,
          [planId, dia],
        );

        let dayId = existing[0]?.id;
        if (!dayId) {
          const [ins] = await connection.query(
            `INSERT INTO diet_plan_days
               (diet_plan_id, week_index, dia_semana, notes,
                calories, protein_g, carbs_g, fats_g)
             VALUES (?, 1, ?, NULL, 0, 0, 0, 0)`,
            [planId, dia],
          );
          dayId = ins.insertId;
        }
        dayIds.push({ dia, dayId });
      }

      const mondayDayId = dayIds[0].dayId;

      // Meals aún sin día → Lunes
      await connection.query(
        `UPDATE diet_meals
         SET diet_day_id = ?
         WHERE diet_plan_id = ? AND diet_day_id IS NULL`,
        [mondayDayId, planId],
      );

      // Plantilla: meals del lunes (o cualquier meal del plan)
      let [templateMeals] = await connection.query(
        `SELECT id, name, sort_order, time_hint
         FROM diet_meals
         WHERE diet_day_id = ?
         ORDER BY sort_order ASC, id ASC`,
        [mondayDayId],
      );

      if (!templateMeals.length) {
        const [anyMeals] = await connection.query(
          `SELECT id, name, sort_order, time_hint, diet_day_id
           FROM diet_meals
           WHERE diet_plan_id = ?
           ORDER BY sort_order ASC, id ASC`,
          [planId],
        );
        if (!anyMeals.length) continue;

        // Reasignar al lunes si estaban en otro día
        for (const meal of anyMeals) {
          if (meal.diet_day_id !== mondayDayId) {
            await connection.query(
              'UPDATE diet_meals SET diet_day_id = ? WHERE id = ?',
              [mondayDayId, meal.id],
            );
          }
        }
        templateMeals = anyMeals.map((m) => ({
          id: m.id,
          name: m.name,
          sort_order: m.sort_order,
          time_hint: m.time_hint,
        }));
      }

      async function loadItems(mealId) {
        const [items] = await connection.query(
          `SELECT food_name, quantity, unit, calories, protein_g, carbs_g, fats_g, sort_order
           FROM diet_items WHERE diet_meal_id = ? ORDER BY sort_order ASC, id ASC`,
          [mealId],
        );
        return items;
      }

      // Clonar a Mar–Dom si el día no tiene meals
      for (let d = 1; d < dayIds.length; d += 1) {
        const { dayId } = dayIds[d];
        const [countRows] = await connection.query(
          'SELECT COUNT(*) AS c FROM diet_meals WHERE diet_day_id = ?',
          [dayId],
        );
        if (Number(countRows[0]?.c) > 0) continue;

        for (const meal of templateMeals) {
          const items = await loadItems(meal.id);
          // Incluir diet_plan_id para respetar fk_diet_meals_plan mientras exista
          const [mealIns] = await connection.query(
            `INSERT INTO diet_meals
               (diet_plan_id, diet_day_id, name, sort_order, time_hint)
             VALUES (?, ?, ?, ?, ?)`,
            [planId, dayId, meal.name, meal.sort_order, meal.time_hint],
          );
          for (const item of items) {
            await connection.query(
              `INSERT INTO diet_items
                 (diet_meal_id, food_name, quantity, unit,
                  calories, protein_g, carbs_g, fats_g, sort_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                mealIns.insertId,
                item.food_name,
                item.quantity,
                item.unit,
                item.calories,
                item.protein_g,
                item.carbs_g,
                item.fats_g,
                item.sort_order,
              ],
            );
          }
        }
      }

      for (const { dayId } of dayIds) {
        const [sums] = await connection.query(
          `SELECT
             COALESCE(SUM(i.calories), 0) AS calories,
             COALESCE(SUM(i.protein_g), 0) AS protein_g,
             COALESCE(SUM(i.carbs_g), 0) AS carbs_g,
             COALESCE(SUM(i.fats_g), 0) AS fats_g
           FROM diet_meals m
           LEFT JOIN diet_items i ON i.diet_meal_id = m.id
           WHERE m.diet_day_id = ?`,
          [dayId],
        );
        const s = sums[0] || {};
        await connection.query(
          `UPDATE diet_plan_days
           SET calories = ?, protein_g = ?, carbs_g = ?, fats_g = ?
           WHERE id = ?`,
          [
            Number(s.calories) || 0,
            Number(s.protein_g) || 0,
            Number(s.carbs_g) || 0,
            Number(s.fats_g) || 0,
            dayId,
          ],
        );
      }

      const [avgRows] = await connection.query(
        `SELECT
           AVG(calories) AS calories,
           AVG(protein_g) AS protein_g,
           AVG(carbs_g) AS carbs_g,
           AVG(fats_g) AS fats_g
         FROM diet_plan_days
         WHERE diet_plan_id = ?
           AND (calories > 0 OR protein_g > 0 OR carbs_g > 0 OR fats_g > 0)`,
        [planId],
      );
      const avg = avgRows[0] || {};
      await connection.query(
        `UPDATE diet_plans
         SET calories = ?, protein_g = ?, carbs_g = ?, fats_g = ?
         WHERE id = ?`,
        [
          Math.round((Number(avg.calories) || 0) * 100) / 100,
          Math.round((Number(avg.protein_g) || 0) * 100) / 100,
          Math.round((Number(avg.carbs_g) || 0) * 100) / 100,
          Math.round((Number(avg.fats_g) || 0) * 100) / 100,
          planId,
        ],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { ensureDietPlansTables, DAYS };
