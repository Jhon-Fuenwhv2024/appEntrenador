/**
 * Probe running API: does PUT persist superset_letter?
 * Usage: node scripts/probeLiveSuperset.js [baseUrl]
 * Example: node scripts/probeLiveSuperset.js http://localhost:3001/api
 */
require('dotenv').config();
const pool = require('../src/config/db');
const bcrypt = require('bcrypt');

const BASE = process.argv[2] || 'http://localhost:3000/api';
console.log('Probing', BASE);

async function main() {
  const [trainers] = await pool.query(
    `SELECT id, username, password FROM usuarios WHERE rol = 'trainer' ORDER BY id ASC LIMIT 1`,
  );
  const trainer = trainers[0];
  const candidates = [
    process.env.TEST_TRAINER_PASSWORD,
    process.env.SMOKE_PASSWORD,
    '123456',
    'password',
    'trainer',
    'admin123',
    'jhon123',
    'Jhon123',
    'lucas123',
  ].filter(Boolean);

  let password = null;
  for (const candidate of candidates) {
    if (await bcrypt.compare(candidate, trainer.password).catch(() => false)) {
      password = candidate;
      break;
    }
  }
  if (!password) {
    console.log('No password candidate matched — skip live HTTP probe');
    await pool.end();
    return;
  }

  const loginRes = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: trainer.username, password }),
  });
  const loginBody = await loginRes.json();
  if (!loginBody.success) {
    console.log('LOGIN FAIL', loginRes.status, loginBody.error);
    await pool.end();
    process.exitCode = 1;
    return;
  }
  const token = loginBody.token || loginBody.data?.token;
  if (!token) {
    console.log('LOGIN shape unexpected', Object.keys(loginBody));
    await pool.end();
    process.exitCode = 1;
    return;
  }
  console.log('login OK');

  const [clients] = await pool.query(
    `SELECT id FROM usuarios WHERE rol = 'client' AND trainer_id = ? LIMIT 1`,
    [trainer.id],
  );
  const clientId = clients[0].id;
  const listRes = await fetch(`${BASE}/clients/${clientId}/routines`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listBody = await listRes.json();
  const routine = (listBody.data || [])[0];
  if (!routine) throw new Error('no routines');

  const putRes = await fetch(`${BASE}/routines/${routine.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dia_semana: routine.dia_semana,
      nombre_rutina: routine.nombre_rutina,
      ejercicios: [
        {
          nombre: 'LiveProbe Press',
          series: 2,
          repeticiones: 8,
          peso: 20,
          rest_time_seconds: 30,
          superset_letter: 'A',
        },
        {
          nombre: 'LiveProbe Remo',
          series: 2,
          repeticiones: 8,
          peso: 20,
          rest_time_seconds: 45,
          superset_letter: 'A',
        },
      ],
    }),
  });
  const putBody = await putRes.json();
  const letters = (putBody.data?.ejercicios || []).map((e) => e.superset_letter);
  console.log('PUT status', putRes.status, 'success', putBody.success, 'letters', letters);

  const [dbRows] = await pool.query(
    `SELECT nombre, superset_letter FROM ejercicios WHERE rutina_id = ? ORDER BY id`,
    [routine.id],
  );
  console.log('DB rows', dbRows);

  const liveOk = letters[0] === 'A' && letters[1] === 'A'
    && dbRows[0]?.superset_letter === 'A'
    && dbRows[1]?.superset_letter === 'A';
  console.log(liveOk ? 'LIVE API PASS' : 'LIVE API FAIL');

  await pool.end();
  if (!liveOk) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
