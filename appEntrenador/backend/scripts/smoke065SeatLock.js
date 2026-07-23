/**
 * Smoke Feature 065 opción B — SEAT_LOCKED en alumno fuera del top-3.
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const { JWT_SECRET } = require('../src/config/env');
const {
  resolveEffectiveSaasPlan,
} = require('../src/shared/saas/effectivePlan');
const {
  getIncludedClientIds,
  FREE_CLIENT_LIMIT,
} = require('../src/shared/saas/trainerSeats');

const API = process.env.SMOKE_API_BASE || 'http://127.0.0.1:3000/api';

async function main() {
  const [trainers] = await db.query(
    `SELECT u.id, u.username, u.nombre, u.is_superadmin,
            ti.saas_plan, ti.saas_expiration_date
     FROM usuarios u
     LEFT JOIN trainers_info ti ON ti.user_id = u.id
     WHERE u.rol = 'trainer'
     ORDER BY u.id`,
  );

  let target = null;
  let clients = [];
  for (const t of trainers) {
    const resolved = resolveEffectiveSaasPlan(t.saas_plan, t.saas_expiration_date);
    if (resolved.effective_plan !== 'FREE') continue;
    const [rows] = await db.query(
      `SELECT id, nombre FROM usuarios
       WHERE trainer_id = ? AND rol = 'client'
       ORDER BY id ASC`,
      [t.id],
    );
    if (rows.length > FREE_CLIENT_LIMIT) {
      target = { ...t, resolved };
      clients = rows;
      break;
    }
  }

  if (!target) {
    throw new Error('No hay trainer FREE/vencido con >3 alumnos para smoke SEAT_LOCKED');
  }

  const included = await getIncludedClientIds(target.id);
  const locked = clients.find((c) => !included.includes(Number(c.id)));

  console.log('target', {
    id: target.id,
    user: target.username,
    clients: clients.length,
    included,
    lockedId: locked?.id,
  });

  const token = jwt.sign(
    {
      id: target.id,
      username: target.username,
      nombre: target.nombre,
      rol: 'trainer',
      is_superadmin: target.is_superadmin === 1 || target.is_superadmin === true,
    },
    JWT_SECRET || 'dev-secret',
    { expiresIn: '15m' },
  );

  const listRes = await fetch(`${API}/clients`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listBody = await listRes.json();
  const lockedItem = (listBody.clients || []).find((c) => Number(c.id) === Number(locked.id));
  console.log('list seat_editable locked', lockedItem?.seat_editable);
  if (lockedItem?.seat_editable !== false) {
    throw new Error('Listado: alumno exceso debería tener seat_editable=false');
  }

  const writeRes = await fetch(`${API}/clients/${locked.id}/routines`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dia_semana: 'Lunes',
      nombre_rutina: 'Smoke seat lock',
      ejercicios: [],
    }),
  });
  const writeBody = await writeRes.json();
  console.log('write locked', writeRes.status, writeBody);
  if (writeRes.status !== 402 || writeBody?.error !== 'SEAT_LOCKED') {
    throw new Error('Se esperaba 402 SEAT_LOCKED al escribir alumno exceso');
  }

  const msgRes = await fetch(`${API}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiver_id: locked.id,
      content: 'smoke seat lock chat ok',
    }),
  });
  console.log('chat locked client', msgRes.status);
  if (msgRes.status >= 400) {
    const body = await msgRes.json().catch(() => ({}));
    if (body?.error === 'SEAT_LOCKED') {
      throw new Error('Chat no debe bloquearse por SEAT_LOCKED');
    }
  }

  await db.end();
  console.log('SMOKE 065 SEAT_LOCKED OK');
}

main().catch(async (err) => {
  console.error(err);
  try { await db.end(); } catch { /* */ }
  process.exit(1);
});
