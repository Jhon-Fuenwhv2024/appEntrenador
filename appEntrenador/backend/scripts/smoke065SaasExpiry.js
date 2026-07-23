/**
 * Smoke Feature 065 — account effective_plan + invite 402 (PRO vencido).
 * Usa JWT firmado localmente (sin password) contra trainer ya vencido en DB.
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const { JWT_SECRET } = require('../src/config/env');
const { resolveEffectiveSaasPlan } = require('../src/shared/saas/effectivePlan');

const API = process.env.SMOKE_API_BASE || 'http://127.0.0.1:3000/api';

async function main() {
  const [rows] = await db.query(
    `SELECT u.id, u.username, u.nombre, u.rol, u.is_superadmin,
            ti.saas_plan, ti.saas_expiration_date,
       (SELECT COUNT(*) FROM usuarios c WHERE c.trainer_id = u.id AND c.rol = 'client')
       + (SELECT COUNT(*) FROM invitaciones i WHERE i.trainer_id = u.id AND i.status = 'pending') AS slots
     FROM usuarios u
     LEFT JOIN trainers_info ti ON ti.user_id = u.id
     WHERE u.rol = 'trainer'
     ORDER BY u.id
     LIMIT 20`,
  );

  const target = rows.find((r) => {
    const eff = resolveEffectiveSaasPlan(r.saas_plan, r.saas_expiration_date);
    return eff.is_expired && Number(r.slots) >= 3;
  }) || rows.find((r) => {
    const eff = resolveEffectiveSaasPlan(r.saas_plan, r.saas_expiration_date);
    return eff.is_expired;
  });

  if (!target) {
    throw new Error('No hay trainer PRO vencido para smoke; crea uno o ajusta fecha.');
  }

  const resolved = resolveEffectiveSaasPlan(target.saas_plan, target.saas_expiration_date);
  console.log('target', {
    id: target.id,
    user: target.username,
    slots: Number(target.slots),
    ...resolved,
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

  const accountRes = await fetch(`${API}/me/account`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const accountBody = await accountRes.json();
  console.log('account', accountRes.status, {
    saas_plan: accountBody?.data?.saas_plan,
    saas_expiration_date: accountBody?.data?.saas_expiration_date,
    effective_plan: accountBody?.data?.effective_plan,
    is_expired: accountBody?.data?.is_expired,
  });

  if (!accountRes.ok) {
    throw new Error(`GET /me/account falló: ${accountRes.status}`);
  }
  if (accountBody?.data?.effective_plan !== 'FREE' || accountBody?.data?.is_expired !== true) {
    throw new Error('Account no refleja soft-expiry esperado');
  }

  if (Number(target.slots) < 3) {
    console.log('slots < 3 → skip invite 402 (account OK)');
  } else {
    const inviteRes = await fetch(`${API}/invites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    const inviteBody = await inviteRes.json();
    console.log('invite', inviteRes.status, inviteBody);
    if (inviteRes.status !== 402 || inviteBody?.error !== 'LIMIT_EXCEEDED') {
      throw new Error('Se esperaba 402 LIMIT_EXCEEDED');
    }
    if (!String(inviteBody?.message || '').toLowerCase().includes('venc')) {
      throw new Error(`Mensaje 402 sin vencimiento: ${inviteBody?.message}`);
    }
    console.log('OK invite 402 por PRO vencido');
  }

  await db.end();
  console.log('SMOKE 065 OK');
}

main().catch(async (err) => {
  console.error(err);
  try { await db.end(); } catch { /* */ }
  process.exit(1);
});
