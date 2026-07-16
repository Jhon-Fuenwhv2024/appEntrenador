/**
 * Feature 033 smoke test: asegura tablas e inserta un check-in mock con FK válidas.
 * Usage: node scripts/test-feature-033.js
 *
 * Requiere al menos un usuario con rol=client en `usuarios`.
 * Limpia el registro de prueba al final.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = require('../src/config/db');
const { ensureCheckinsTables } = require('../src/db/ensureCheckinsTables');
const { ensurePhotosDir } = require('../src/middleware/uploadProgressPhotos');

async function main() {
  ensurePhotosDir();
  console.log('[test-033] Carpeta uploads/photos OK');

  await ensureCheckinsTables();
  console.log('[test-033] Tablas weekly_checkins / progress_photos OK');

  const [clients] = await pool.query(
    `SELECT id FROM usuarios WHERE rol = 'client' ORDER BY id ASC LIMIT 1`,
  );

  if (clients.length === 0) {
    throw new Error('No hay clientes en usuarios. Crea un cliente antes de correr este test.');
  }

  const clientId = clients[0].id;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const createdAt = `${y}-${m}-${d}`;

  const connection = await pool.getConnection();
  let checkinId = null;
  let photoId = null;

  try {
    await connection.beginTransaction();

    const [checkinResult] = await connection.execute(
      `INSERT INTO weekly_checkins
        (client_id, created_at, sleep_quality, stress_level, diet_adherence, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [clientId, createdAt, 4, 2, 5, 'Mock check-in Feature 033'],
    );

    checkinId = checkinResult.insertId;
    console.log('[test-033] weekly_checkins insert OK id=', checkinId);

    const [photoResult] = await connection.execute(
      `INSERT INTO progress_photos
        (client_id, checkin_id, image_url, pose_type, taken_at)
       VALUES (?, ?, ?, ?, ?)`,
      [clientId, checkinId, '/uploads/photos/mock-front.jpg', 'front', createdAt],
    );

    photoId = photoResult.insertId;
    console.log('[test-033] progress_photos insert OK id=', photoId);

    // JOIN de historial (mismo patrón que el service)
    const [joined] = await connection.execute(
      `SELECT c.id AS checkin_id, p.id AS photo_id, p.pose_type
       FROM weekly_checkins c
       LEFT JOIN progress_photos p ON p.checkin_id = c.id
       WHERE c.id = ?`,
      [checkinId],
    );

    if (joined.length === 0 || Number(joined[0].photo_id) !== Number(photoId)) {
      throw new Error('JOIN checkin↔photos falló');
    }
    console.log('[test-033] JOIN historial OK');

    await connection.execute('DELETE FROM progress_photos WHERE id = ?', [photoId]);
    await connection.execute('DELETE FROM weekly_checkins WHERE id = ?', [checkinId]);
    await connection.commit();
    checkinId = null;
    photoId = null;
    console.log('[test-033] Mock limpiado');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  // CHECK constraint fuera de la tx principal (un fallo abortaría la tx en InnoDB)
  try {
    await pool.execute(
      `INSERT INTO weekly_checkins
        (client_id, created_at, sleep_quality, stress_level, diet_adherence, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [clientId, createdAt, 9, 1, 1, 'should-fail'],
    );
    throw new Error('CHECK constraint no rechazó sleep_quality=9');
  } catch (err) {
    if (err.message.includes('CHECK constraint no rechazó')) throw err;
    console.log('[test-033] CHECK sleep_quality rechazó valor 9 (esperado)');
  }

  console.log('[test-033] PASS — FKs, JOIN y constraints OK.');
  await pool.end();
}

main().catch((err) => {
  console.error('[test-033] FAIL:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
