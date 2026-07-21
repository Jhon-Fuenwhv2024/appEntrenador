const db = require('../../config/db');
const clientsService = require('../clients/clients.service');
const nutritionService = require('../nutrition/nutrition.service');

const TITLE_MAX = 150;
const MEAL_NAME_MAX = 100;
const FOOD_NAME_MAX = 150;
const UNIT_MAX = 50;
const TIME_HINT_MAX = 20;
const MACRO_MAX = 999999.99;

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function roundMacro(value) {
  return Math.round(Number(value) * 100) / 100;
}

function emptyTotals() {
  return { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 };
}

function addTotals(target, source) {
  target.calories = roundMacro(target.calories + source.calories);
  target.protein_g = roundMacro(target.protein_g + source.protein_g);
  target.carbs_g = roundMacro(target.carbs_g + source.carbs_g);
  target.fats_g = roundMacro(target.fats_g + source.fats_g);
  return target;
}

function normalizeNonNegativeMacro(raw, fieldLabel, context) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > MACRO_MAX) {
    throw createHttpError(
      `${fieldLabel} inválido en ${context} (usa 0–${MACRO_MAX}).`,
      400,
    );
  }
  return roundMacro(value);
}

function normalizeQuantity(raw, context) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > MACRO_MAX) {
    throw createHttpError(`Cantidad inválida en ${context}.`, 400);
  }
  return roundMacro(value);
}

function normalizeItem(raw, mealIndex, itemIndex) {
  const context = `comida #${mealIndex + 1}, alimento #${itemIndex + 1}`;
  const food_name = typeof raw?.food_name === 'string' ? raw.food_name.trim() : '';
  if (!food_name) {
    throw createHttpError(`El alimento en ${context} necesita un nombre.`, 400);
  }
  if (food_name.length > FOOD_NAME_MAX) {
    throw createHttpError(
      `El nombre del alimento en ${context} no puede superar ${FOOD_NAME_MAX} caracteres.`,
      400,
    );
  }

  const unitRaw = typeof raw?.unit === 'string' ? raw.unit.trim() : 'g';
  const unit = unitRaw || 'g';
  if (unit.length > UNIT_MAX) {
    throw createHttpError(`Unidad inválida en ${context}.`, 400);
  }

  const sort_order = Number.isInteger(Number(raw?.sort_order))
    ? Number(raw.sort_order)
    : itemIndex;

  return {
    food_name,
    quantity: normalizeQuantity(raw?.quantity ?? 1, context),
    unit,
    calories: normalizeNonNegativeMacro(raw?.calories ?? 0, 'calories', context),
    protein_g: normalizeNonNegativeMacro(raw?.protein_g ?? 0, 'protein_g', context),
    carbs_g: normalizeNonNegativeMacro(raw?.carbs_g ?? 0, 'carbs_g', context),
    fats_g: normalizeNonNegativeMacro(raw?.fats_g ?? 0, 'fats_g', context),
    sort_order,
  };
}

function normalizeMeal(raw, mealIndex) {
  const name = typeof raw?.name === 'string' ? raw.name.trim() : '';
  if (!name) {
    throw createHttpError(`La comida #${mealIndex + 1} necesita un nombre.`, 400);
  }
  if (name.length > MEAL_NAME_MAX) {
    throw createHttpError(
      `El nombre de la comida #${mealIndex + 1} no puede superar ${MEAL_NAME_MAX} caracteres.`,
      400,
    );
  }

  let time_hint = null;
  if (raw?.time_hint != null && String(raw.time_hint).trim() !== '') {
    time_hint = String(raw.time_hint).trim();
    if (time_hint.length > TIME_HINT_MAX) {
      throw createHttpError(
        `time_hint inválido en la comida "${name}" (máx. ${TIME_HINT_MAX}).`,
        400,
      );
    }
  }

  const itemsRaw = Array.isArray(raw?.items) ? raw.items : [];
  const items = itemsRaw.map((item, itemIndex) => normalizeItem(item, mealIndex, itemIndex));

  const sort_order = Number.isInteger(Number(raw?.sort_order))
    ? Number(raw.sort_order)
    : mealIndex;

  return {
    name,
    sort_order,
    time_hint,
    items,
  };
}

/**
 * Valida el payload y calcula macros del plan SOLO desde diet_items.
 * Ignora calories/protein_g/carbs_g/fats_g enviados a nivel plan o meal.
 */
function validateDietPlanPayload(payload) {
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  if (!title) {
    throw createHttpError('El título del plan es obligatorio.', 400);
  }
  if (title.length > TITLE_MAX) {
    throw createHttpError(`El título no puede superar ${TITLE_MAX} caracteres.`, 400);
  }

  const notes =
    payload?.notes == null || String(payload.notes).trim() === ''
      ? null
      : String(payload.notes).trim();

  let client_id = null;
  if (payload?.client_id != null && payload.client_id !== '') {
    client_id = Number(payload.client_id);
    if (!Number.isInteger(client_id) || client_id < 1) {
      throw createHttpError('client_id inválido.', 400);
    }
  }

  const mealsRaw = Array.isArray(payload?.meals) ? payload.meals : [];
  if (mealsRaw.length === 0) {
    throw createHttpError('Debes incluir al menos una comida.', 400);
  }

  const meals = mealsRaw.map((meal, index) => normalizeMeal(meal, index));
  const hasItems = meals.some((meal) => meal.items.length > 0);
  if (!hasItems) {
    throw createHttpError('Debes incluir al menos un alimento en el plan.', 400);
  }

  const totals = emptyTotals();
  for (const meal of meals) {
    for (const item of meal.items) {
      addTotals(totals, item);
    }
  }

  const is_active = Boolean(payload?.is_active);

  return {
    title,
    notes,
    client_id,
    is_active,
    meals,
    totals,
  };
}

function mapItemRow(row) {
  return {
    id: row.id,
    diet_meal_id: row.diet_meal_id,
    food_name: row.food_name,
    quantity: Number(row.quantity),
    unit: row.unit,
    calories: Number(row.calories),
    protein_g: Number(row.protein_g),
    carbs_g: Number(row.carbs_g),
    fats_g: Number(row.fats_g),
    sort_order: row.sort_order,
  };
}

function mapMealRow(row, items = []) {
  const mealTotals = emptyTotals();
  for (const item of items) {
    addTotals(mealTotals, item);
  }

  return {
    id: row.id,
    diet_plan_id: row.diet_plan_id,
    name: row.name,
    sort_order: row.sort_order,
    time_hint: row.time_hint,
    calories: mealTotals.calories,
    protein_g: mealTotals.protein_g,
    carbs_g: mealTotals.carbs_g,
    fats_g: mealTotals.fats_g,
    items,
  };
}

function mapPlanRow(row, meals = []) {
  return {
    id: row.id,
    trainer_id: row.trainer_id,
    client_id: row.client_id,
    title: row.title,
    notes: row.notes,
    calories: Number(row.calories),
    protein_g: Number(row.protein_g),
    carbs_g: Number(row.carbs_g),
    fats_g: Number(row.fats_g),
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
    meals,
  };
}

async function assertClientOwnedIfPresent(trainerId, clientId) {
  if (clientId == null) return;
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
}

async function getPlanOwnedByTrainer(planId, trainerId) {
  const id = Number(planId);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError('ID de plan inválido.', 400);
  }

  const [rows] = await db.query(
    `SELECT id, trainer_id, client_id, title, notes,
            calories, protein_g, carbs_g, fats_g, is_active,
            created_at, updated_at
     FROM diet_plans
     WHERE id = ? AND trainer_id = ?`,
    [id, trainerId],
  );

  if (!rows.length) {
    throw createHttpError('Plan de dieta no encontrado.', 404);
  }

  return rows[0];
}

async function loadMealsWithItems(planIds) {
  if (!planIds.length) return new Map();

  const placeholders = planIds.map(() => '?').join(',');
  const [mealRows] = await db.query(
    `SELECT id, diet_plan_id, name, sort_order, time_hint
     FROM diet_meals
     WHERE diet_plan_id IN (${placeholders})
     ORDER BY sort_order ASC, id ASC`,
    planIds,
  );

  const mealIds = mealRows.map((m) => m.id);
  let itemRows = [];
  if (mealIds.length) {
    const itemPlaceholders = mealIds.map(() => '?').join(',');
    const [items] = await db.query(
      `SELECT id, diet_meal_id, food_name, quantity, unit,
              calories, protein_g, carbs_g, fats_g, sort_order
       FROM diet_items
       WHERE diet_meal_id IN (${itemPlaceholders})
       ORDER BY sort_order ASC, id ASC`,
      mealIds,
    );
    itemRows = items;
  }

  const itemsByMeal = new Map();
  for (const item of itemRows) {
    const list = itemsByMeal.get(item.diet_meal_id) || [];
    list.push(mapItemRow(item));
    itemsByMeal.set(item.diet_meal_id, list);
  }

  const mealsByPlan = new Map();
  for (const meal of mealRows) {
    const items = itemsByMeal.get(meal.id) || [];
    const list = mealsByPlan.get(meal.diet_plan_id) || [];
    list.push(mapMealRow(meal, items));
    mealsByPlan.set(meal.diet_plan_id, list);
  }

  return mealsByPlan;
}

async function getFullPlanById(planId) {
  const [rows] = await db.query(
    `SELECT id, trainer_id, client_id, title, notes,
            calories, protein_g, carbs_g, fats_g, is_active,
            created_at, updated_at
     FROM diet_plans
     WHERE id = ?`,
    [planId],
  );

  if (!rows.length) {
    throw createHttpError('Plan de dieta no encontrado.', 404);
  }

  const mealsByPlan = await loadMealsWithItems([planId]);
  return mapPlanRow(rows[0], mealsByPlan.get(planId) || []);
}

async function insertMealsAndItems(connection, planId, meals) {
  for (const meal of meals) {
    const [mealResult] = await connection.query(
      `INSERT INTO diet_meals (diet_plan_id, name, sort_order, time_hint)
       VALUES (?, ?, ?, ?)`,
      [planId, meal.name, meal.sort_order, meal.time_hint],
    );

    const mealId = mealResult.insertId;

    for (const item of meal.items) {
      await connection.query(
        `INSERT INTO diet_items
           (diet_meal_id, food_name, quantity, unit,
            calories, protein_g, carbs_g, fats_g, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mealId,
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

/**
 * Si el plan queda activo y tiene client_id, desactiva el resto de planes del cliente.
 */
async function enforceSingleActive(connection, clientId, activePlanId) {
  if (clientId == null) return;

  await connection.query(
    `UPDATE diet_plans
     SET is_active = 0
     WHERE client_id = ? AND id <> ? AND is_active = 1`,
    [clientId, activePlanId],
  );
}

/**
 * Si el plan queda activo, sincroniza totales → nutrition_targets (031).
 * Objetivos diarios siguen editables sin plan de comidas.
 */
async function syncNutritionTargetsIfActive(trainerId, plan, queryExecutor = db) {
  if (!plan?.is_active || plan.client_id == null) return null;

  return nutritionService.syncFromDietPlanTotals(trainerId, plan.client_id, {
    calories: plan.calories,
    protein_g: plan.protein_g,
    carbs_g: plan.carbs_g,
    fats_g: plan.fats_g,
  }, queryExecutor);
}

async function listDietPlans(trainerId, clientIdFilter) {
  const params = [trainerId];
  let sql = `
    SELECT id, trainer_id, client_id, title, notes,
           calories, protein_g, carbs_g, fats_g, is_active,
           created_at, updated_at
    FROM diet_plans
    WHERE trainer_id = ?
  `;

  if (clientIdFilter != null && clientIdFilter !== '') {
    const clientId = Number(clientIdFilter);
    if (!Number.isInteger(clientId) || clientId < 1) {
      throw createHttpError('clientId inválido.', 400);
    }
    await clientsService.getClientOwnedByTrainer(clientId, trainerId);
    sql += ' AND client_id = ?';
    params.push(clientId);
  }

  sql += ' ORDER BY updated_at DESC, id DESC';

  const [rows] = await db.query(sql, params);
  const planIds = rows.map((r) => r.id);
  const mealsByPlan = await loadMealsWithItems(planIds);

  return rows.map((row) => mapPlanRow(row, mealsByPlan.get(row.id) || []));
}

async function getDietPlanForTrainer(trainerId, planId) {
  await getPlanOwnedByTrainer(planId, trainerId);
  return getFullPlanById(planId);
}

async function createDietPlan(trainerId, payload) {
  const data = validateDietPlanPayload(payload);
  await assertClientOwnedIfPresent(trainerId, data.client_id);

  const connection = await db.getConnection();
  let planId;

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO diet_plans
         (trainer_id, client_id, title, notes,
          calories, protein_g, carbs_g, fats_g, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trainerId,
        data.client_id,
        data.title,
        data.notes,
        data.totals.calories,
        data.totals.protein_g,
        data.totals.carbs_g,
        data.totals.fats_g,
        data.is_active ? 1 : 0,
      ],
    );

    planId = result.insertId;
    await insertMealsAndItems(connection, planId, data.meals);

    if (data.is_active) {
      await enforceSingleActive(connection, data.client_id, planId);
      await syncNutritionTargetsIfActive(
        trainerId,
        {
          is_active: true,
          client_id: data.client_id,
          ...data.totals,
        },
        connection,
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const plan = await getFullPlanById(planId);
  return plan;
}

async function updateDietPlan(trainerId, planId, payload) {
  await getPlanOwnedByTrainer(planId, trainerId);
  const data = validateDietPlanPayload(payload);
  await assertClientOwnedIfPresent(trainerId, data.client_id);

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.query(
      `UPDATE diet_plans
       SET client_id = ?, title = ?, notes = ?,
           calories = ?, protein_g = ?, carbs_g = ?, fats_g = ?,
           is_active = ?
       WHERE id = ? AND trainer_id = ?`,
      [
        data.client_id,
        data.title,
        data.notes,
        data.totals.calories,
        data.totals.protein_g,
        data.totals.carbs_g,
        data.totals.fats_g,
        data.is_active ? 1 : 0,
        planId,
        trainerId,
      ],
    );

    if (!updateResult.affectedRows) {
      throw createHttpError('Plan de dieta no encontrado.', 404);
    }

    // Nested replace: CASCADE borra items al borrar meals
    await connection.query('DELETE FROM diet_meals WHERE diet_plan_id = ?', [planId]);
    await insertMealsAndItems(connection, planId, data.meals);

    if (data.is_active) {
      await enforceSingleActive(connection, data.client_id, planId);
      await syncNutritionTargetsIfActive(
        trainerId,
        {
          is_active: true,
          client_id: data.client_id,
          ...data.totals,
        },
        connection,
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const plan = await getFullPlanById(planId);
  return plan;
}

async function deleteDietPlan(trainerId, planId) {
  await getPlanOwnedByTrainer(planId, trainerId);
  await db.query('DELETE FROM diet_plans WHERE id = ? AND trainer_id = ?', [
    planId,
    trainerId,
  ]);
}

async function activateDietPlan(trainerId, planId) {
  const plan = await getPlanOwnedByTrainer(planId, trainerId);

  if (plan.client_id == null) {
    throw createHttpError(
      'No se puede activar un plan sin cliente asignado. Asigna un client_id primero.',
      400,
    );
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE diet_plans
       SET is_active = 0
       WHERE client_id = ? AND is_active = 1`,
      [plan.client_id],
    );

    await connection.query(
      `UPDATE diet_plans
       SET is_active = 1
       WHERE id = ? AND trainer_id = ?`,
      [planId, trainerId],
    );

    await syncNutritionTargetsIfActive(
      trainerId,
      { ...plan, is_active: true },
      connection,
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const fullPlan = await getFullPlanById(planId);
  return fullPlan;
}

/**
 * Cliente autenticado: plan activo propio (meals + items).
 */
async function getActiveDietPlanForClient(clientId) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError('Cliente inválido.', 400);
  }

  const [rows] = await db.query(
    `SELECT id, trainer_id, client_id, title, notes,
            calories, protein_g, carbs_g, fats_g, is_active,
            created_at, updated_at
     FROM diet_plans
     WHERE client_id = ? AND is_active = 1
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`,
    [id],
  );

  if (!rows.length) {
    return null;
  }

  const mealsByPlan = await loadMealsWithItems([rows[0].id]);
  return mapPlanRow(rows[0], mealsByPlan.get(rows[0].id) || []);
}

module.exports = {
  listDietPlans,
  getDietPlanForTrainer,
  createDietPlan,
  updateDietPlan,
  deleteDietPlan,
  activateDietPlan,
  getActiveDietPlanForClient,
  validateDietPlanPayload,
  createHttpError,
};
