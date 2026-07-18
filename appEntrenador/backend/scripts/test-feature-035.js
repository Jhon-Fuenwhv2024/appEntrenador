/**
 * Feature 035 smoke: getDashboardStats (retention + pendingTasks + weekProgress).
 * Usage: node scripts/test-feature-035.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const db = require('../src/config/db');
const { ensureCheckinsTables } = require('../src/db/ensureCheckinsTables');
const clientsService = require('../src/modules/clients/clients.service');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  await ensureCheckinsTables();

  const [trainers] = await db.query(
    `SELECT id, username FROM usuarios WHERE rol = 'trainer' ORDER BY id ASC LIMIT 1`,
  );
  if (!trainers.length) {
    throw new Error('No hay trainer en usuarios.');
  }

  const trainerId = trainers[0].id;
  console.log('[test-035] trainer', trainerId, trainers[0].username);

  const data = await clientsService.getDashboardStats(trainerId);

  assert(typeof data.clientsCount === 'number', 'clientsCount');
  assert(data.retention && typeof data.retention.active === 'number', 'retention.active');
  assert(typeof data.retention.inactive === 'number', 'retention.inactive');
  assert(typeof data.retention.ratePercent === 'number', 'retention.ratePercent');
  assert(data.retention.windowDays === 14, 'retention.windowDays');
  assert(data.pendingTasks && typeof data.pendingTasks.unreviewedCheckins === 'number', 'pending.checkins');
  assert(typeof data.pendingTasks.dietsUnassigned === 'number', 'pending.diets');
  assert(
    data.pendingTasks.total === data.pendingTasks.unreviewedCheckins + data.pendingTasks.dietsUnassigned,
    'pending.total',
  );
  assert(data.weekProgress && Array.isArray(data.weekProgress.byDay), 'weekProgress.byDay');
  assert(data.weekProgress.byDay.length === 7, 'byDay length 7');
  assert(typeof data.weekProgress.sessionsCompleted === 'number', 'sessionsCompleted');
  assert(typeof data.weekProgress.vsPreviousPercent === 'number', 'vsPreviousPercent');

  console.log('[test-035] OK', {
    clientsCount: data.clientsCount,
    retention: data.retention,
    pendingTasks: data.pendingTasks,
    weekProgress: {
      sessionsCompleted: data.weekProgress.sessionsCompleted,
      previousWeekSessions: data.weekProgress.previousWeekSessions,
      vsPreviousPercent: data.weekProgress.vsPreviousPercent,
      weekStart: data.weekProgress.weekStart,
      byDay: data.weekProgress.byDay,
    },
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[test-035] FAIL', error.message);
    process.exit(1);
  });
