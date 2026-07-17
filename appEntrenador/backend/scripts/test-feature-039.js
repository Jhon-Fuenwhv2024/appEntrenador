/**
 * Feature 039 smoke test: GET /clients/:id/overview (service + ownership).
 * Usage: node scripts/test-feature-039.js
 *
 * Requiere al menos un trainer con un cliente asignado en `usuarios`.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const db = require('../src/config/db');
const clientsService = require('../src/modules/clients/clients.service');

async function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const [pairs] = await db.query(
    `SELECT t.id AS trainer_id, t.username AS trainer_username,
            c.id AS client_id, c.nombre AS client_nombre
     FROM usuarios c
     INNER JOIN usuarios t ON t.id = c.trainer_id AND t.rol = 'trainer'
     WHERE c.rol = 'client'
     ORDER BY c.id ASC
     LIMIT 1`,
  );

  if (!pairs.length) {
    throw new Error('No hay pareja trainer↔cliente. Crea un alumno antes de correr este test.');
  }

  const { trainer_id: trainerId, client_id: clientId, client_nombre: clientName } = pairs[0];
  console.log('[test-039] trainer', trainerId, 'client', clientId, clientName);

  const overview = await clientsService.getClientOverview(clientId, trainerId);

  assert(overview?.client?.id === clientId, 'overview.client.id no coincide');
  assert(typeof overview.client.nombre === 'string', 'overview.client.nombre faltante');
  assert(overview.profile && overview.profile.user_id === clientId, 'overview.profile inválido');
  assert(overview.counts && typeof overview.counts.routines === 'number', 'counts.routines');
  assert(typeof overview.counts.sessions === 'number', 'counts.sessions');
  assert(typeof overview.counts.checkins === 'number', 'counts.checkins');
  assert('lastSession' in overview, 'lastSession key');
  assert('lastCheckin' in overview, 'lastCheckin key');
  assert('nutritionTargets' in overview, 'nutritionTargets key');
  assert(overview.membership === null, 'membership slot debe ser null hasta 040');
  assert(overview.consistencyScore === null, 'consistencyScore slot debe ser null hasta 042');
  assert(overview.prsThisMonth === null, 'prsThisMonth slot debe ser null hasta 041');

  console.log('[test-039] overview OK', {
    routines: overview.counts.routines,
    sessions: overview.counts.sessions,
    checkins: overview.counts.checkins,
    hasLastSession: Boolean(overview.lastSession),
    hasLastCheckin: Boolean(overview.lastCheckin),
    hasNutrition: Boolean(overview.nutritionTargets),
  });

  // Ownership: otro trainer no debe ver el overview
  const [otherTrainers] = await db.query(
    `SELECT id FROM usuarios WHERE rol = 'trainer' AND id <> ? ORDER BY id ASC LIMIT 1`,
    [trainerId],
  );

  if (otherTrainers.length) {
    let rejected = false;
    try {
      await clientsService.getClientOverview(clientId, otherTrainers[0].id);
    } catch (error) {
      rejected = Number(error.code) === 404;
      console.log('[test-039] ownership reject OK code=', error.code);
    }
    assert(rejected, 'Otro trainer debería recibir 404 al pedir overview');
  } else {
    console.log('[test-039] skip ownership cross-trainer (solo hay un trainer)');
  }

  // clientId inválido
  let invalidRejected = false;
  try {
    await clientsService.getClientOverview(0, trainerId);
  } catch (error) {
    invalidRejected = Number(error.code) === 400;
  }
  assert(invalidRejected, 'clientId=0 debería ser 400');

  console.log('[test-039] PASS');
}

main()
  .catch((err) => {
    console.error('[test-039] FAIL', err.message, err.code || '');
    process.exitCode = 1;
  })
  .finally(() => db.end().catch(() => {}));
