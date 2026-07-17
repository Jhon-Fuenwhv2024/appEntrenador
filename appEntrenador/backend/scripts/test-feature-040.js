/**
 * Feature 040 smoke: membership upsert, client view, soft-lock.
 * Usage: node scripts/test-feature-040.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const db = require('../src/config/db');
const membershipsService = require('../src/modules/memberships/memberships.service');
const clientsService = require('../src/modules/clients/clients.service');

async function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const [pairs] = await db.query(
    `SELECT t.id AS trainer_id, c.id AS client_id, c.nombre AS client_nombre
     FROM usuarios c
     INNER JOIN usuarios t ON t.id = c.trainer_id AND t.rol = 'trainer'
     WHERE c.rol = 'client'
     ORDER BY c.id ASC
     LIMIT 1`,
  );

  if (!pairs.length) {
    throw new Error('No hay pareja trainer↔cliente.');
  }

  const { trainer_id: trainerId, client_id: clientId } = pairs[0];
  console.log('[test-040] trainer', trainerId, 'client', clientId);

  const periodStart = new Date().toISOString().slice(0, 10);

  const saved = await membershipsService.upsertForTrainer(trainerId, clientId, {
    status: 'active',
    period_start: periodStart,
    notes: 'nota interna test-040',
    block_on_unpaid: false,
  });

  assert(saved?.status === 'active', 'status active');
  assert(saved?.notes === 'nota interna test-040', 'notes trainer');
  assert(typeof saved.days_remaining === 'number', 'days_remaining number');
  assert(saved.period_end != null, 'period_end auto mensual');
  // Ciclo: inicio → día anterior del mismo día del mes siguiente (~29–30 días)
  assert(saved.days_remaining >= 27 && saved.days_remaining <= 31, 'days_remaining ~30 días');

  // Regla explícita: 17 → 16 del mes siguiente
  const july = await membershipsService.upsertForTrainer(trainerId, clientId, {
    status: 'active',
    period_start: '2026-07-17',
    notes: null,
    block_on_unpaid: false,
  });
  assert(july.period_end === '2026-08-16', `esperado 2026-08-16, got ${july.period_end}`);

  const forClient = await membershipsService.getForClient(clientId);
  assert(forClient?.status === 'active', 'client status');
  assert(!('notes' in forClient), 'client must not see notes');
  assert(typeof forClient.days_remaining === 'number', 'client days_remaining');

  const overview = await clientsService.getClientOverview(clientId, trainerId);
  assert(overview.membership?.status === 'active', 'overview membership');

  const list = await clientsService.getClientsForTrainer(trainerId);
  const listed = list.find((c) => c.id === clientId);
  assert(listed?.membership?.status === 'active', 'list membership');

  // Soft-lock: owing + block
  await membershipsService.upsertForTrainer(trainerId, clientId, {
    status: 'owing',
    period_start: periodStart,
    notes: 'bloqueo',
    block_on_unpaid: true,
  });

  let blocked = false;
  try {
    await membershipsService.assertClientMembershipAccess(clientId);
  } catch (error) {
    blocked = error.error === 'MEMBERSHIP_BLOCKED' && Number(error.code) === 403;
    console.log('[test-040] block OK', error.error, error.code);
  }
  assert(blocked, 'assertClientMembershipAccess debe bloquear');

  // Restore active without block
  await membershipsService.upsertForTrainer(trainerId, clientId, {
    status: 'active',
    period_start: periodStart,
    notes: null,
    block_on_unpaid: false,
  });
  await membershipsService.assertClientMembershipAccess(clientId);
  console.log('[test-040] access restored OK');

  console.log('[test-040] PASS');
  process.exit(0);
}

main().catch((error) => {
  console.error('[test-040] FAIL', error);
  process.exit(1);
});
