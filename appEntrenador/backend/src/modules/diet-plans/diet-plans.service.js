const db = require('../../config/db');
const clientsService = require('../clients/clients.service');
const nutritionService = require('../nutrition/nutrition.service');
const { assertClientWritableUnderPlan } = require('../../shared/saas/trainerSeats');

const TITLE_MAX = 150;
const MEAL_NAME_MAX = 100;
const FOOD_NAME_MAX = 150;
const UNIT_MAX = 50;
const TIME_HINT_MAX = 20;
const MACRO_MAX = 999999.99;

const DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

/** JS getUTCDay() 0=Sun … 6=Sat → ENUM español */
const WEEKDAY_BY_JS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const ALLOWED_CYCLE_WEEKS = new Set([2, 3, 4]);

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
  target.calories = roundMacro(target.calories + Number(source.calories || 0));
  target.protein_g = roundMacro(target.protein_g + Number(source.protein_g || 0));
  target.carbs_g = roundMacro(target.carbs_g + Number(source.carbs_g || 0));
  target.fats_g = roundMacro(target.fats_g + Number(source.fats_g || 0));
  return target;
}

function averageDayTotals(days) {
  const withItems = (days || []).filter((day) =>
    (day.meals || []).some((meal) => (meal.items || []).length > 0),
  );
  if (!withItems.length) return emptyTotals();

  const sum = emptyTotals();
  for (const day of withItems) {
    addTotals(sum, day.totals || day);
  }
  return {
    calories: roundMacro(sum.calories / withItems.length),
    protein_g: roundMacro(sum.protein_g / withItems.length),
    carbs_g: roundMacro(sum.carbs_g / withItems.length),
    fats_g: roundMacro(sum.fats_g / withItems.length),
  };
}

function normalizeNonNegativeMacro(raw, fieldLabel, context) {
  const value = raw === '' || raw == null ? 0 : Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > MACRO_MAX) {
    throw createHttpError(
      `${fieldLabel} inválido en ${context} (usa 0–${MACRO_MAX}).`,
      400,
    );
  }
  return roundMacro(value);
}

function normalizeQuantity(raw, context) {
  const value = raw === '' || raw == null ? NaN : Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > MACRO_MAX) {
    throw createHttpError(
      `Cantidad inválida en ${context} (debe ser mayor que 0).`,
      400,
    );
  }
  return roundMacro(value);
}

function parseYmd(ymd) {
  const raw = String(ymd || '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw createHttpError('Fecha inválida (usa YYYY-MM-DD).', 400);
  }
  const [y, m, d] = raw.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y
    || dt.getUTCMonth() !== m - 1
    || dt.getUTCDate() !== d
  ) {
    throw createHttpError('Fecha inválida (usa YYYY-MM-DD).', 400);
  }
  return dt;
}

function formatYmd(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Normaliza DATE de MySQL/mysql2 (Date | string) a YYYY-MM-DD.
 * Evita String(date).slice(0,10) → "Mon Jul 20" (rompe parseYmd).
 */
function sqlDateToYmd(value) {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return sqlDateToYmd(parsed);
  }
  return null;
}

function todayYmd() {
  // Fecha civil local del servidor (no UTC-only) para defaults sin ?date=
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toMondayYmd(ymd) {
  const dt = parseYmd(ymd);
  const jsDay = dt.getUTCDay();
  const offset = jsDay === 0 ? -6 : 1 - jsDay;
  dt.setUTCDate(dt.getUTCDate() + offset);
  return formatYmd(dt);
}

function resolveCyclePosition(cycleStartDate, cycleLengthWeeks, dateYmd) {
  const startYmd = sqlDateToYmd(cycleStartDate) || String(cycleStartDate || '').trim().slice(0, 10);
  const targetYmd = sqlDateToYmd(dateYmd) || String(dateYmd || '').trim().slice(0, 10);
  const start = parseYmd(toMondayYmd(startYmd));
  const target = parseYmd(targetYmd);
  const diffDays = Math.floor((target.getTime() - start.getTime()) / 86400000);
  let weeksSince = Math.floor(diffDays / 7);
  const weekIndex =
    ((((weeksSince % cycleLengthWeeks) + cycleLengthWeeks) % cycleLengthWeeks) + 1);
  const dia_semana = WEEKDAY_BY_JS[target.getUTCDay()];
  return {
    date: formatYmd(target),
    week_index: weekIndex,
    dia_semana,
  };
}

function dayLabel(weekIndex, diaSemana) {
  return `Semana ${weekIndex} · ${diaSemana}`;
}

function normalizeItem(raw, mealIndex, itemIndex, placeLabel) {
  const mealRef = `comida #${mealIndex + 1}`;
  const context = `${placeLabel} · ${mealRef} · alimento #${itemIndex + 1}`;
  const food_name = typeof raw?.food_name === 'string' ? raw.food_name.trim() : '';
  if (!food_name) {
    throw createHttpError(
      `${placeLabel} · ${mealRef}: el alimento #${itemIndex + 1} necesita un nombre.`,
      400,
    );
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

function normalizeMeal(raw, mealIndex, placeLabel) {
  const mealRef = `comida #${mealIndex + 1}`;
  const name = typeof raw?.name === 'string' ? raw.name.trim() : '';
  if (!name) {
    throw createHttpError(
      `${placeLabel} · ${mealRef}: necesita un nombre (ej. Desayuno).`,
      400,
    );
  }
  if (name.length > MEAL_NAME_MAX) {
    throw createHttpError(
      `${placeLabel} · ${mealRef}: el nombre no puede superar ${MEAL_NAME_MAX} caracteres.`,
      400,
    );
  }

  let time_hint = null;
  if (raw?.time_hint != null && String(raw.time_hint).trim() !== '') {
    time_hint = String(raw.time_hint).trim();
    if (time_hint.length > TIME_HINT_MAX) {
      throw createHttpError(
        `${placeLabel} · comida "${name}": hora inválida (máx. ${TIME_HINT_MAX} caracteres).`,
        400,
      );
    }
  }

  const itemsRaw = Array.isArray(raw?.items) ? raw.items : [];
  const items = itemsRaw.map((item, itemIndex) =>
    normalizeItem(item, mealIndex, itemIndex, placeLabel),
  );

  if (items.length === 0) {
    throw createHttpError(
      `${placeLabel} · comida "${name}": añade al menos un alimento con nombre.`,
      400,
    );
  }

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

function normalizeDay(raw, dayIndex, cycleLengthWeeks) {
  const week_index = Number(raw?.week_index);
  if (!Number.isInteger(week_index) || week_index < 1 || week_index > cycleLengthWeeks) {
    throw createHttpError(
      `Día #${dayIndex + 1}: week_index inválido (usa 1–${cycleLengthWeeks}).`,
      400,
    );
  }

  const dia_semana = typeof raw?.dia_semana === 'string' ? raw.dia_semana.trim() : '';
  if (!DAYS.includes(dia_semana)) {
    throw createHttpError(
      `Día #${dayIndex + 1}: dia_semana inválido (usa Lunes–Domingo).`,
      400,
    );
  }

  const place = dayLabel(week_index, dia_semana);

  let notes = null;
  if (raw?.notes != null && String(raw.notes).trim() !== '') {
    notes = String(raw.notes).trim();
  }

  const mealsRaw = Array.isArray(raw?.meals) ? raw.meals : [];
  if (mealsRaw.length === 0) {
    throw createHttpError(
      `${place}: no tiene comidas. Añade al menos una comida con un alimento, o no envíes ese día.`,
      400,
    );
  }

  const meals = mealsRaw.map((meal, mealIndex) =>
    normalizeMeal(meal, mealIndex, place),
  );

  const totals = emptyTotals();
  for (const meal of meals) {
    for (const item of meal.items) {
      addTotals(totals, item);
    }
  }

  return {
    week_index,
    dia_semana,
    notes,
    meals,
    totals,
  };
}

/**
 * Valida payload ciclo: days[] → meals → items.
 * Totales de plan = media de días con ≥1 item.
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

  const cycle_length_weeks = Number(payload?.cycle_length_weeks ?? 4);
  if (!ALLOWED_CYCLE_WEEKS.has(cycle_length_weeks)) {
    throw createHttpError('cycle_length_weeks debe ser 2, 3 o 4.', 400);
  }

  const cycleStartRaw =
    payload?.cycle_start_date != null && String(payload.cycle_start_date).trim() !== ''
      ? String(payload.cycle_start_date).trim().slice(0, 10)
      : todayYmd();
  const cycle_start_date = toMondayYmd(cycleStartRaw);

  const daysRaw = Array.isArray(payload?.days) ? payload.days : [];
  if (daysRaw.length === 0) {
    // Compat: FE antiguo enviaba meals en raíz (043)
    const legacyMeals = Array.isArray(payload?.meals) ? payload.meals : [];
    if (legacyMeals.length > 0) {
      throw createHttpError(
        'Este plan usa ciclo multi-semana. Recarga la página e indica Semana + día (L–D) antes de guardar.',
        400,
      );
    }
    throw createHttpError(
      'Ningún día del ciclo tiene alimentos. Elige una Semana (1–N) y un día (L–D), escribe el nombre del alimento (ej. “Avena”) y guarda. Los días vacíos no se envían.',
      400,
    );
  }

  const days = daysRaw.map((day, index) =>
    normalizeDay(day, index, cycle_length_weeks),
  );

  const seen = new Set();
  for (const day of days) {
    const key = `${day.week_index}:${day.dia_semana}`;
    if (seen.has(key)) {
      throw createHttpError(
        `Día duplicado: ${dayLabel(day.week_index, day.dia_semana)}.`,
        400,
      );
    }
    seen.add(key);
  }

  const hasItems = days.some((day) =>
    day.meals.some((meal) => meal.items.length > 0),
  );
  if (!hasItems) {
    const first = days[0];
    throw createHttpError(
      `Ningún día tiene alimentos. Empieza por ${dayLabel(first.week_index, first.dia_semana)} y escribe el nombre de un alimento.`,
      400,
    );
  }

  const totals = averageDayTotals(days);
  const is_active = Boolean(payload?.is_active);

  return {
    title,
    notes,
    client_id,
    is_active,
    cycle_length_weeks,
    cycle_start_date,
    days,
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
    diet_day_id: row.diet_day_id,
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

function mapDayRow(row, meals = []) {
  return {
    id: row.id,
    diet_plan_id: row.diet_plan_id,
    week_index: Number(row.week_index),
    dia_semana: row.dia_semana,
    notes: row.notes,
    calories: Number(row.calories),
    protein_g: Number(row.protein_g),
    carbs_g: Number(row.carbs_g),
    fats_g: Number(row.fats_g),
    meals,
  };
}

function mapPlanRow(row, days = []) {
  const mealCount = days.reduce(
    (acc, day) => acc + (Array.isArray(day.meals) ? day.meals.length : 0),
    0,
  );

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
    cycle_length_weeks: Number(row.cycle_length_weeks) || 4,
    cycle_start_date: sqlDateToYmd(row.cycle_start_date),
    created_at: row.created_at,
    updated_at: row.updated_at,
    days,
    day_count: days.length,
    meal_count: mealCount,
  };
}

const PLAN_SELECT = `
  id, trainer_id, client_id, title, notes,
  calories, protein_g, carbs_g, fats_g, is_active,
  cycle_length_weeks, cycle_start_date,
  created_at, updated_at
`;

async function assertClientOwnedIfPresent(trainerId, clientId) {
  if (clientId == null) return;
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
}

/** Soft-lock FREE: bloquea writes de planes asignados a alumnos fuera del cupo. */
async function assertClientWritableIfPresent(trainerId, clientId) {
  if (clientId == null) return;
  await assertClientWritableUnderPlan(trainerId, clientId);
}

async function getPlanOwnedByTrainer(planId, trainerId) {
  const id = Number(planId);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError('ID de plan inválido.', 400);
  }

  const [rows] = await db.query(
    `SELECT ${PLAN_SELECT}
     FROM diet_plans
     WHERE id = ? AND trainer_id = ?`,
    [id, trainerId],
  );

  if (!rows.length) {
    throw createHttpError('Plan de dieta no encontrado.', 404);
  }

  return rows[0];
}

async function loadDaysWithMeals(planIds) {
  if (!planIds.length) return new Map();

  const placeholders = planIds.map(() => '?').join(',');
  const [dayRows] = await db.query(
    `SELECT id, diet_plan_id, week_index, dia_semana, notes,
            calories, protein_g, carbs_g, fats_g
     FROM diet_plan_days
     WHERE diet_plan_id IN (${placeholders})
     ORDER BY week_index ASC,
       FIELD(dia_semana, 'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'),
       id ASC`,
    planIds,
  );

  const dayIds = dayRows.map((d) => d.id);
  let mealRows = [];
  if (dayIds.length) {
    const dayPlaceholders = dayIds.map(() => '?').join(',');
    const [meals] = await db.query(
      `SELECT id, diet_day_id, name, sort_order, time_hint
       FROM diet_meals
       WHERE diet_day_id IN (${dayPlaceholders})
       ORDER BY sort_order ASC, id ASC`,
      dayIds,
    );
    mealRows = meals;
  }

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

  const mealsByDay = new Map();
  for (const meal of mealRows) {
    const items = itemsByMeal.get(meal.id) || [];
    const list = mealsByDay.get(meal.diet_day_id) || [];
    list.push(mapMealRow(meal, items));
    mealsByDay.set(meal.diet_day_id, list);
  }

  const daysByPlan = new Map();
  for (const day of dayRows) {
    const meals = mealsByDay.get(day.id) || [];
    const list = daysByPlan.get(day.diet_plan_id) || [];
    list.push(mapDayRow(day, meals));
    daysByPlan.set(day.diet_plan_id, list);
  }

  return daysByPlan;
}

async function getFullPlanById(planId) {
  const [rows] = await db.query(
    `SELECT ${PLAN_SELECT}
     FROM diet_plans
     WHERE id = ?`,
    [planId],
  );

  if (!rows.length) {
    throw createHttpError('Plan de dieta no encontrado.', 404);
  }

  const daysByPlan = await loadDaysWithMeals([planId]);
  return mapPlanRow(rows[0], daysByPlan.get(planId) || []);
}

async function insertDaysMealsAndItems(connection, planId, days) {
  for (const day of days) {
    const [dayResult] = await connection.query(
      `INSERT INTO diet_plan_days
         (diet_plan_id, week_index, dia_semana, notes,
          calories, protein_g, carbs_g, fats_g)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        planId,
        day.week_index,
        day.dia_semana,
        day.notes,
        day.totals.calories,
        day.totals.protein_g,
        day.totals.carbs_g,
        day.totals.fats_g,
      ],
    );

    const dayId = dayResult.insertId;

    for (const meal of day.meals) {
      const [mealResult] = await connection.query(
        `INSERT INTO diet_meals (diet_day_id, name, sort_order, time_hint)
         VALUES (?, ?, ?, ?)`,
        [dayId, meal.name, meal.sort_order, meal.time_hint],
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
}

async function enforceSingleActive(connection, clientId, activePlanId) {
  if (clientId == null) return;

  await connection.query(
    `UPDATE diet_plans
     SET is_active = 0
     WHERE client_id = ? AND id <> ? AND is_active = 1`,
    [clientId, activePlanId],
  );
}

async function syncNutritionTargetsIfActive(trainerId, plan) {
  if (!plan?.is_active || plan.client_id == null) return null;

  try {
    return await nutritionService.syncFromDietPlanTotals(trainerId, plan.client_id, {
      calories: plan.calories,
      protein_g: plan.protein_g,
      carbs_g: plan.carbs_g,
      fats_g: plan.fats_g,
    });
  } catch (error) {
    // El plan ya se persistió; no tumbar create/update/activate por la sync 031.
    console.error(
      'Sync nutrition_targets desde plan de dieta falló (plan guardado igual):',
      error.message,
    );
    return null;
  }
}

async function listDietPlans(trainerId, clientIdFilter) {
  const params = [trainerId];
  let sql = `
    SELECT ${PLAN_SELECT}
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
  const daysByPlan = await loadDaysWithMeals(planIds);

  return rows.map((row) => mapPlanRow(row, daysByPlan.get(row.id) || []));
}

async function getDietPlanForTrainer(trainerId, planId) {
  await getPlanOwnedByTrainer(planId, trainerId);
  return getFullPlanById(planId);
}

async function createDietPlan(trainerId, payload) {
  const data = validateDietPlanPayload(payload);
  await assertClientOwnedIfPresent(trainerId, data.client_id);
  await assertClientWritableIfPresent(trainerId, data.client_id);

  const connection = await db.getConnection();
  let planId;

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO diet_plans
         (trainer_id, client_id, title, notes,
          calories, protein_g, carbs_g, fats_g, is_active,
          cycle_length_weeks, cycle_start_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        data.cycle_length_weeks,
        data.cycle_start_date,
      ],
    );

    planId = result.insertId;
    await insertDaysMealsAndItems(connection, planId, data.days);

    if (data.is_active) {
      await enforceSingleActive(connection, data.client_id, planId);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const plan = await getFullPlanById(planId);
  await syncNutritionTargetsIfActive(trainerId, plan);
  return plan;
}

async function updateDietPlan(trainerId, planId, payload) {
  const existing = await getPlanOwnedByTrainer(planId, trainerId);
  const data = validateDietPlanPayload(payload);
  await assertClientOwnedIfPresent(trainerId, data.client_id);
  // Bloquear si el plan ya estaba o pasa a estar asignado a un alumno fuera de cupo
  await assertClientWritableIfPresent(trainerId, existing.client_id);
  await assertClientWritableIfPresent(trainerId, data.client_id);

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.query(
      `UPDATE diet_plans
       SET client_id = ?, title = ?, notes = ?,
           calories = ?, protein_g = ?, carbs_g = ?, fats_g = ?,
           is_active = ?, cycle_length_weeks = ?, cycle_start_date = ?
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
        data.cycle_length_weeks,
        data.cycle_start_date,
        planId,
        trainerId,
      ],
    );

    if (!updateResult.affectedRows) {
      throw createHttpError('Plan de dieta no encontrado.', 404);
    }

    // Nested replace: CASCADE borra meals/items al borrar days
    await connection.query('DELETE FROM diet_plan_days WHERE diet_plan_id = ?', [
      planId,
    ]);
    await insertDaysMealsAndItems(connection, planId, data.days);

    if (data.is_active) {
      await enforceSingleActive(connection, data.client_id, planId);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const plan = await getFullPlanById(planId);
  await syncNutritionTargetsIfActive(trainerId, plan);
  return plan;
}

async function deleteDietPlan(trainerId, planId) {
  const plan = await getPlanOwnedByTrainer(planId, trainerId);
  await assertClientWritableIfPresent(trainerId, plan.client_id);
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

  await assertClientWritableUnderPlan(trainerId, plan.client_id);

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

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const fullPlan = await getFullPlanById(planId);
  await syncNutritionTargetsIfActive(trainerId, fullPlan);
  return fullPlan;
}

function findDayInPlan(days, weekIndex, diaSemana) {
  return (days || []).find(
    (d) => d.week_index === weekIndex && d.dia_semana === diaSemana,
  ) || null;
}

/**
 * Cliente autenticado: plan activo + día resuelto para `date` (YYYY-MM-DD).
 */
async function getActiveDietPlanForClient(clientId, dateYmd) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError('Cliente inválido.', 400);
  }

  const date = dateYmd && String(dateYmd).trim() !== ''
    ? (sqlDateToYmd(dateYmd) || String(dateYmd).trim().slice(0, 10))
    : todayYmd();
  parseYmd(date);

  const [rows] = await db.query(
    `SELECT ${PLAN_SELECT}
     FROM diet_plans
     WHERE client_id = ? AND is_active = 1
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`,
    [id],
  );

  if (!rows.length) {
    return null;
  }

  const plan = mapPlanRow(rows[0], []);
  const cycleStart = plan.cycle_start_date || toMondayYmd(todayYmd());
  const resolved = resolveCyclePosition(
    cycleStart,
    plan.cycle_length_weeks,
    date,
  );

  const daysByPlan = await loadDaysWithMeals([plan.id]);
  const days = daysByPlan.get(plan.id) || [];
  const day = findDayInPlan(days, resolved.week_index, resolved.dia_semana);

  return {
    id: plan.id,
    trainer_id: plan.trainer_id,
    client_id: plan.client_id,
    title: plan.title,
    notes: plan.notes,
    calories: plan.calories,
    protein_g: plan.protein_g,
    carbs_g: plan.carbs_g,
    fats_g: plan.fats_g,
    is_active: plan.is_active,
    cycle_length_weeks: plan.cycle_length_weeks,
    cycle_start_date: cycleStart,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
    resolved,
    day: day
      ? {
          id: day.id,
          week_index: day.week_index,
          dia_semana: day.dia_semana,
          notes: day.notes,
          calories: day.calories,
          protein_g: day.protein_g,
          carbs_g: day.carbs_g,
          fats_g: day.fats_g,
          meals: day.meals,
        }
      : null,
  };
}

/**
 * Preview de la semana del ciclo que contiene `date`.
 */
async function getActiveDietPlanWeekForClient(clientId, dateYmd) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError('Cliente inválido.', 400);
  }

  const date = dateYmd && String(dateYmd).trim() !== ''
    ? (sqlDateToYmd(dateYmd) || String(dateYmd).trim().slice(0, 10))
    : todayYmd();
  parseYmd(date);

  const [rows] = await db.query(
    `SELECT ${PLAN_SELECT}
     FROM diet_plans
     WHERE client_id = ? AND is_active = 1
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`,
    [id],
  );

  if (!rows.length) {
    return null;
  }

  const plan = mapPlanRow(rows[0], []);
  const cycleStart = plan.cycle_start_date || toMondayYmd(todayYmd());
  const resolved = resolveCyclePosition(
    cycleStart,
    plan.cycle_length_weeks,
    date,
  );

  const daysByPlan = await loadDaysWithMeals([plan.id]);
  const days = daysByPlan.get(plan.id) || [];

  const weekDays = DAYS.map((dia_semana) => {
    const found = days.find(
      (d) => d.week_index === resolved.week_index && d.dia_semana === dia_semana,
    );
    return {
      week_index: resolved.week_index,
      dia_semana,
      has_meals: Boolean(found?.meals?.length),
      calories: found ? Number(found.calories) : 0,
      protein_g: found ? Number(found.protein_g) : 0,
      carbs_g: found ? Number(found.carbs_g) : 0,
      fats_g: found ? Number(found.fats_g) : 0,
      meals: found?.meals || [],
      id: found?.id || null,
      notes: found?.notes || null,
    };
  });

  return {
    id: plan.id,
    title: plan.title,
    notes: plan.notes,
    cycle_length_weeks: plan.cycle_length_weeks,
    cycle_start_date: cycleStart,
    resolved,
    days: weekDays,
  };
}

async function cloneMealsToDay(connection, sourceDayId, targetDayId) {
  await connection.query('DELETE FROM diet_meals WHERE diet_day_id = ?', [
    targetDayId,
  ]);

  const [meals] = await connection.query(
    `SELECT id, name, sort_order, time_hint
     FROM diet_meals WHERE diet_day_id = ? ORDER BY sort_order ASC, id ASC`,
    [sourceDayId],
  );

  let dayTotals = emptyTotals();

  for (const meal of meals) {
    const [mealIns] = await connection.query(
      `INSERT INTO diet_meals (diet_day_id, name, sort_order, time_hint)
       VALUES (?, ?, ?, ?)`,
      [targetDayId, meal.name, meal.sort_order, meal.time_hint],
    );

    const [items] = await connection.query(
      `SELECT food_name, quantity, unit, calories, protein_g, carbs_g, fats_g, sort_order
       FROM diet_items WHERE diet_meal_id = ? ORDER BY sort_order ASC, id ASC`,
      [meal.id],
    );

    for (const item of items) {
      addTotals(dayTotals, item);
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

  await connection.query(
    `UPDATE diet_plan_days
     SET calories = ?, protein_g = ?, carbs_g = ?, fats_g = ?
     WHERE id = ?`,
    [
      dayTotals.calories,
      dayTotals.protein_g,
      dayTotals.carbs_g,
      dayTotals.fats_g,
      targetDayId,
    ],
  );
}

async function recalculatePlanAverages(connection, planId) {
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
      roundMacro(avg.calories || 0),
      roundMacro(avg.protein_g || 0),
      roundMacro(avg.carbs_g || 0),
      roundMacro(avg.fats_g || 0),
      planId,
    ],
  );
}

async function ensureDayRow(connection, planId, weekIndex, diaSemana) {
  const [existing] = await connection.query(
    `SELECT id FROM diet_plan_days
     WHERE diet_plan_id = ? AND week_index = ? AND dia_semana = ?`,
    [planId, weekIndex, diaSemana],
  );
  if (existing.length) return existing[0].id;

  const [ins] = await connection.query(
    `INSERT INTO diet_plan_days
       (diet_plan_id, week_index, dia_semana, notes,
        calories, protein_g, carbs_g, fats_g)
     VALUES (?, ?, ?, NULL, 0, 0, 0, 0)`,
    [planId, weekIndex, diaSemana],
  );
  return ins.insertId;
}

async function copyDay(trainerId, planId, payload) {
  const plan = await getPlanOwnedByTrainer(planId, trainerId);
  await assertClientWritableIfPresent(trainerId, plan.client_id);
  const cycleLen = Number(plan.cycle_length_weeks) || 4;

  const fromWeek = Number(payload?.from_week_index);
  const toWeek = Number(payload?.to_week_index);
  const fromDia =
    typeof payload?.from_dia_semana === 'string'
      ? payload.from_dia_semana.trim()
      : '';
  const toDia =
    typeof payload?.to_dia_semana === 'string'
      ? payload.to_dia_semana.trim()
      : '';

  if (!Number.isInteger(fromWeek) || fromWeek < 1 || fromWeek > cycleLen) {
    throw createHttpError('from_week_index inválido.', 400);
  }
  if (!Number.isInteger(toWeek) || toWeek < 1 || toWeek > cycleLen) {
    throw createHttpError('to_week_index inválido.', 400);
  }
  if (!DAYS.includes(fromDia) || !DAYS.includes(toDia)) {
    throw createHttpError('dia_semana inválido.', 400);
  }
  if (fromWeek === toWeek && fromDia === toDia) {
    throw createHttpError('Origen y destino del día deben ser distintos.', 400);
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [sourceRows] = await connection.query(
      `SELECT id FROM diet_plan_days
       WHERE diet_plan_id = ? AND week_index = ? AND dia_semana = ?`,
      [planId, fromWeek, fromDia],
    );
    if (!sourceRows.length) {
      throw createHttpError('Día origen no encontrado o vacío.', 404);
    }

    const targetDayId = await ensureDayRow(connection, planId, toWeek, toDia);
    await cloneMealsToDay(connection, sourceRows[0].id, targetDayId);
    await recalculatePlanAverages(connection, planId);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getFullPlanById(planId);
}

async function copyWeek(trainerId, planId, payload) {
  const plan = await getPlanOwnedByTrainer(planId, trainerId);
  await assertClientWritableIfPresent(trainerId, plan.client_id);
  const cycleLen = Number(plan.cycle_length_weeks) || 4;

  const fromWeek = Number(payload?.from_week);
  const toWeek = Number(payload?.to_week);

  if (!Number.isInteger(fromWeek) || fromWeek < 1 || fromWeek > cycleLen) {
    throw createHttpError('from_week inválido.', 400);
  }
  if (!Number.isInteger(toWeek) || toWeek < 1 || toWeek > cycleLen) {
    throw createHttpError('to_week inválido.', 400);
  }
  if (fromWeek === toWeek) {
    throw createHttpError('Origen y destino de la semana deben ser distintos.', 400);
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const dia of DAYS) {
      const [sourceRows] = await connection.query(
        `SELECT id FROM diet_plan_days
         WHERE diet_plan_id = ? AND week_index = ? AND dia_semana = ?`,
        [planId, fromWeek, dia],
      );
      if (!sourceRows.length) continue;

      const targetDayId = await ensureDayRow(connection, planId, toWeek, dia);
      await cloneMealsToDay(connection, sourceRows[0].id, targetDayId);
    }

    await recalculatePlanAverages(connection, planId);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getFullPlanById(planId);
}

module.exports = {
  DAYS,
  listDietPlans,
  getDietPlanForTrainer,
  createDietPlan,
  updateDietPlan,
  deleteDietPlan,
  activateDietPlan,
  getActiveDietPlanForClient,
  getActiveDietPlanWeekForClient,
  copyDay,
  copyWeek,
  validateDietPlanPayload,
  resolveCyclePosition,
  toMondayYmd,
  createHttpError,
};
