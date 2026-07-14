/**
 * Smoke: profile get/upsert via service (no HTTP auth).
 * Usage: node scripts/smokeProfile.js
 */
const db = require('../src/config/db');
const profileService = require('../src/modules/profile/profile.service');

async function main() {
  const [clients] = await db.query(
    "SELECT id, nombre, username, trainer_id FROM usuarios WHERE rol = 'client' LIMIT 1",
  );
  if (!clients.length) {
    throw new Error('No hay clientes en la BD');
  }
  const client = clients[0];
  const asClient = { id: client.id, rol: 'client' };

  const got = await profileService.getProfile(asClient, client.id);
  console.log('[smokeProfile] GET client OK', {
    user_id: got.user_id,
    nombre: got.nombre,
    foto_url: got.foto_url,
  });

  const saved = await profileService.upsertProfile(
    asClient,
    client.id,
    { telefono: '3000000000', objetivo: 'Smoke test 020' },
    null,
  );
  console.log('[smokeProfile] PUT upsert OK', {
    telefono: saved.telefono,
    objetivo: saved.objetivo,
  });

  if (client.trainer_id) {
    const asTrainer = { id: client.trainer_id, rol: 'trainer' };
    const viaTrainer = await profileService.getProfile(asTrainer, client.id);
    console.log('[smokeProfile] GET trainer OK', viaTrainer.user_id);
  }

  console.log('[smokeProfile] OK');
}

main()
  .catch((err) => {
    console.error('[smokeProfile] FAIL', err.message, err.code || '');
    process.exitCode = 1;
  })
  .finally(() => db.end().catch(() => {}));
