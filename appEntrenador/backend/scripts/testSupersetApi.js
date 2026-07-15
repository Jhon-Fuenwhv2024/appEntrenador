/**
 * Integration smoke: login trainer → update a routine with superset letters → verify GET.
 * Usage: node scripts/testSupersetApi.js
 */
require('dotenv').config();
const pool = require('../src/config/db');

const BASE = process.env.API_BASE || 'http://localhost:3000/api';

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  // Find a trainer + client + routine from DB
  const [trainers] = await pool.query(
    `SELECT id, username FROM usuarios WHERE rol = 'trainer' ORDER BY id ASC LIMIT 1`,
  );
  if (!trainers.length) throw new Error('No trainer in DB');

  const [clients] = await pool.query(
    `SELECT id, username FROM usuarios WHERE rol = 'client' AND trainer_id = ? ORDER BY id ASC LIMIT 1`,
    [trainers[0].id],
  );
  if (!clients.length) throw new Error('No client for trainer');

  const [routines] = await pool.query(
    `SELECT id, nombre_rutina, dia_semana FROM rutinas WHERE alumno_id = ? ORDER BY id DESC LIMIT 1`,
    [clients[0].id],
  );
  if (!routines.length) throw new Error('No routine for client');

  const routineId = routines[0].id;
  console.log('trainer', trainers[0].username, 'client', clients[0].username, 'routine', routineId);

  // Need password — try common local/dev passwords from env or skip login via direct service
  const password = process.env.TEST_TRAINER_PASSWORD || process.env.SMOKE_PASSWORD;
  if (!password) {
    console.log('No TEST_TRAINER_PASSWORD — testing via service layer directly');
    const routinesService = require('../src/modules/routines/routines.service');
    const payload = {
      dia_semana: routines[0].dia_semana,
      nombre_rutina: routines[0].nombre_rutina,
      ejercicios: [
        {
          nombre: 'SS Press Test',
          series: 2,
          repeticiones: 10,
          peso: 40,
          rest_time_seconds: 60,
          superset_letter: 'A',
          indicaciones: '',
        },
        {
          nombre: 'SS Remo Test',
          series: 2,
          repeticiones: 10,
          peso: 30,
          rest_time_seconds: 90,
          superset_letter: 'A',
          indicaciones: '',
        },
        {
          nombre: 'SS Curl Test',
          series: 1,
          repeticiones: 12,
          peso: 10,
          rest_time_seconds: 45,
          superset_letter: null,
          indicaciones: '',
        },
      ],
    };

    const updated = await routinesService.updateRoutine(trainers[0].id, routineId, payload);
    console.log('updateRoutine returned letters:', updated.ejercicios.map((e) => ({
      nombre: e.nombre,
      letter: e.superset_letter,
    })));

    const listed = await routinesService.listRoutinesForClientAsTrainer(
      trainers[0].id,
      clients[0].id,
    );
    const again = listed.find((r) => r.id === routineId);
    console.log('listForClient letters:', again.ejercicios.map((e) => ({
      nombre: e.nombre,
      letter: e.superset_letter,
    })));

    const ok = again.ejercicios[0].superset_letter === 'A'
      && again.ejercicios[1].superset_letter === 'A'
      && again.ejercicios[2].superset_letter == null;
    console.log(ok ? 'SERVICE PASS' : 'SERVICE FAIL');
    if (!ok) process.exitCode = 1;
  } else {
    const login = await jsonFetch(`${BASE}/login`, {
      method: 'POST',
      body: JSON.stringify({ username: trainers[0].username, password }),
    });
    console.log('login', login.status, login.body?.success);
    if (!login.body?.success) throw new Error('Login failed');
    const token = login.body.data.token;

    const getBefore = await jsonFetch(`${BASE}/clients/${clients[0].id}/routines`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const routine = (getBefore.body.data || []).find((r) => r.id === routineId);
    console.log('before', routine?.ejercicios?.map((e) => e.superset_letter));

    const put = await jsonFetch(`${BASE}/routines/${routineId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        dia_semana: routine.dia_semana,
        nombre_rutina: routine.nombre_rutina,
        ejercicios: [
          {
            nombre: 'SS Press Test',
            series: 2,
            repeticiones: 10,
            peso: 40,
            rest_time_seconds: 60,
            superset_letter: 'A',
          },
          {
            nombre: 'SS Remo Test',
            series: 2,
            repeticiones: 10,
            peso: 30,
            rest_time_seconds: 90,
            superset_letter: 'A',
          },
        ],
      }),
    });
    console.log('PUT', put.status, put.body?.success);
    console.log('PUT letters', put.body?.data?.ejercicios?.map((e) => e.superset_letter));

    const getAfter = await jsonFetch(`${BASE}/clients/${clients[0].id}/routines`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const after = (getAfter.body.data || []).find((r) => r.id === routineId);
    console.log('after', after?.ejercicios?.map((e) => ({ n: e.nombre, l: e.superset_letter })));
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
