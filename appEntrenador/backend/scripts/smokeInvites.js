/**
 * Smoke Feature 023 via HTTP using a real trainer from DB + signed JWT.
 * Usage: node scripts/smokeInvites.js
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../src/config/env');

const BASE = process.env.SMOKE_API_URL || 'http://localhost:3000/api';

async function request(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  const [trainers] = await db.query(
    "SELECT id, username, nombre, rol FROM usuarios WHERE rol = 'trainer' LIMIT 1",
  );

  if (!trainers.length) {
    throw new Error('No hay trainer en la DB para smoke');
  }

  const trainer = trainers[0];
  const token = jwt.sign(
    {
      id: trainer.id,
      username: trainer.username,
      nombre: trainer.nombre,
      rol: trainer.rol,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  console.log('[smokeInvites] trainer=', trainer.username, 'id=', trainer.id);

  console.log('[smokeInvites] POST /invites…');
  const created = await request('POST', '/invites', { token });
  if (!created.json.success || !created.json.data?.token) {
    throw new Error(`Create falló (${created.status}): ${JSON.stringify(created.json)}`);
  }
  console.log('  created id=', created.json.data.id, 'status=', created.json.data.status);

  console.log('[smokeInvites] GET /invites…');
  const listed = await request('GET', '/invites', { token });
  if (!listed.json.success || !Array.isArray(listed.json.data)) {
    throw new Error(`List falló (${listed.status}): ${JSON.stringify(listed.json)}`);
  }
  console.log('  count=', listed.json.data.length);

  console.log('[smokeInvites] POST /invites (para revoke)…');
  const toRevoke = await request('POST', '/invites', { token });
  const revokeId = toRevoke.json.data?.id;
  if (!revokeId) {
    throw new Error(`Create-for-revoke falló: ${JSON.stringify(toRevoke.json)}`);
  }

  console.log('[smokeInvites] PATCH /invites/:id/revoke…');
  const revoked = await request('PATCH', `/invites/${revokeId}/revoke`, { token });
  if (!revoked.json.success || revoked.json.data?.status !== 'revoked') {
    throw new Error(`Revoke falló (${revoked.status}): ${JSON.stringify(revoked.json)}`);
  }

  const inviteToken = created.json.data.token;
  const uniqueUser = `smoke_cli_${Date.now()}`;

  console.log('[smokeInvites] POST /register con token pending…');
  const registered = await request('POST', '/register', {
    body: {
      username: uniqueUser,
      password: 'Smoke123!',
      nombre: 'Smoke Client',
      token: inviteToken,
    },
  });
  if (!registered.json.success) {
    throw new Error(`Register falló (${registered.status}): ${JSON.stringify(registered.json)}`);
  }

  console.log('[smokeInvites] POST /register con token ya used (debe fallar)…');
  const reuse = await request('POST', '/register', {
    body: {
      username: `${uniqueUser}_b`,
      password: 'Smoke123!',
      nombre: 'Smoke Client B',
      token: inviteToken,
    },
  });
  if (reuse.json.success || reuse.status !== 403) {
    throw new Error(`Reuse debería ser 403, got ${reuse.status}: ${JSON.stringify(reuse.json)}`);
  }

  console.log('[smokeInvites] alias POST /generate-token…');
  const alias = await request('POST', '/generate-token', { token });
  if (!alias.json.success || !alias.json.token) {
    throw new Error(`Alias falló (${alias.status}): ${JSON.stringify(alias.json)}`);
  }

  console.log('[smokeInvites] OK');
}

main()
  .catch((err) => {
    console.error('[smokeInvites] FAIL:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.end().catch(() => {}));
