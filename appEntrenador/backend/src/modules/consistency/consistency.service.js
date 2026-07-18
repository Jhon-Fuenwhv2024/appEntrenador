const db = require('../../config/db');
const clientsService = require('../clients/clients.service');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/** YYYY-MM-DD in UTC from a Date or MySQL datetime string. */
function toUtcDateKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function addUtcDays(dateKey, delta) {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Consecutive UTC calendar days with ≥1 completed session.
 * Anchor: today if trained today, else yesterday if trained yesterday, else 0.
 */
function computeStreakFromDateKeys(dateKeysSortedDesc, todayKey) {
  const set = new Set(dateKeysSortedDesc);
  let cursor = todayKey;
  if (!set.has(cursor)) {
    cursor = addUtcDays(todayKey, -1);
    if (!set.has(cursor)) return 0;
  }

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }
  return streak;
}

/**
 * Score MVP:
 * workouts_this_week / week_goal * 70 + min(current_streak, 10) * 3  (cap 100)
 */
function computeScore(workoutsThisWeek, weekGoal, currentStreak) {
  const goal = Math.max(1, Number(weekGoal) || 3);
  const workouts = Math.max(0, Number(workoutsThisWeek) || 0);
  const streak = Math.max(0, Number(currentStreak) || 0);
  const raw = (workouts / goal) * 70 + Math.min(streak, 10) * 3;
  return Math.min(100, Math.round(raw));
}

function startOfIsoWeekUtc(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay(); // 0 Sun … 6 Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

function daysRemainingInIsoWeek(now = new Date()) {
  const day = now.getUTCDay(); // 0 Sun
  // Mon=1 … Sun=0 → remaining including today until Sunday
  const daysFromMonday = day === 0 ? 6 : day - 1;
  return 7 - daysFromMonday;
}

async function ensureRow(clientId) {
  await db.query(
    `INSERT INTO client_streaks (client_id, current_streak, best_streak, week_goal)
     VALUES (?, 0, 0, 3)
     ON DUPLICATE KEY UPDATE client_id = client_id`,
    [clientId],
  );
}

async function getRow(clientId) {
  await ensureRow(clientId);
  const [rows] = await db.query(
    `SELECT client_id, current_streak, best_streak, week_goal, updated_at
     FROM client_streaks
     WHERE client_id = ?
     LIMIT 1`,
    [clientId],
  );
  return rows[0];
}

async function listCompletedWorkoutDateKeys(clientId) {
  const [raw] = await db.query(
    `SELECT finished_at, created_at
     FROM workout_sessions
     WHERE client_id = ? AND status = 'completed'`,
    [clientId],
  );
  const keys = new Set();
  for (const r of raw) {
    const key = toUtcDateKey(r.finished_at || r.created_at);
    if (key) keys.add(key);
  }
  return [...keys].sort((a, b) => (a < b ? 1 : -1));
}

async function countWorkoutsThisWeek(clientId) {
  const weekStart = startOfIsoWeekUtc();
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM workout_sessions
     WHERE client_id = ?
       AND status = 'completed'
       AND DATE(COALESCE(finished_at, created_at)) >= ?`,
    [clientId, weekStart],
  );
  return Number(row?.cnt) || 0;
}

async function buildConsistencyPayload(clientId) {
  const row = await getRow(clientId);
  const dateKeys = await listCompletedWorkoutDateKeys(clientId);
  const todayKey = toUtcDateKey(new Date());
  const currentStreak = computeStreakFromDateKeys(dateKeys, todayKey);
  const bestStreak = Math.max(Number(row.best_streak) || 0, currentStreak);
  const weekGoal = Number(row.week_goal) || 3;
  const workoutsThisWeek = await countWorkoutsThisWeek(clientId);
  const score = computeScore(workoutsThisWeek, weekGoal, currentStreak);

  if (currentStreak !== Number(row.current_streak) || bestStreak !== Number(row.best_streak)) {
    await db.query(
      `UPDATE client_streaks
       SET current_streak = ?, best_streak = ?
       WHERE client_id = ?`,
      [currentStreak, bestStreak, clientId],
    );
  }

  return {
    current_streak: currentStreak,
    best_streak: bestStreak,
    week_goal: weekGoal,
    workouts_this_week: workoutsThisWeek,
    score,
    days_remaining_in_week: daysRemainingInIsoWeek(),
  };
}

/**
 * Recalcula y persiste racha tras cerrar sesión. Retorna payload + flags de notificación.
 */
async function recalculateAfterSession(clientId, session) {
  if (!session || session.status !== 'completed') {
    return { consistency: await buildConsistencyPayload(clientId), milestone: null };
  }

  const before = await getRow(clientId);
  const previousStreak = Number(before.current_streak) || 0;
  const consistency = await buildConsistencyPayload(clientId);

  let milestone = null;
  if (
    consistency.current_streak >= 7
    && consistency.current_streak > previousStreak
    && consistency.current_streak % 7 === 0
  ) {
    milestone = consistency.current_streak;
  }

  return { consistency, milestone };
}

async function getMine(clientId) {
  return buildConsistencyPayload(clientId);
}

async function getForTrainer(trainerId, clientId) {
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
  return buildConsistencyPayload(clientId);
}

async function updateWeekGoalForTrainer(trainerId, clientId, weekGoalRaw) {
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
  const weekGoal = Math.round(Number(weekGoalRaw));
  if (!Number.isInteger(weekGoal) || weekGoal < 1 || weekGoal > 14) {
    throw createHttpError('week_goal debe ser un entero entre 1 y 14.', 400);
  }

  await ensureRow(clientId);
  await db.query(
    `UPDATE client_streaks SET week_goal = ? WHERE client_id = ?`,
    [weekGoal, clientId],
  );

  return buildConsistencyPayload(clientId);
}

module.exports = {
  getMine,
  getForTrainer,
  updateWeekGoalForTrainer,
  recalculateAfterSession,
  buildConsistencyPayload,
  computeScore,
  createHttpError,
};
