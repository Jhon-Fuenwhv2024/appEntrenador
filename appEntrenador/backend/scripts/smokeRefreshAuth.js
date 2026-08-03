const crypto = require('crypto');
const db = require('../src/config/db');

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`http://127.0.0.1:3000/api${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

(async () => {
  const [tables] = await db.query("SHOW TABLES LIKE 'refresh_tokens'");
  console.log('table_ok', tables.length === 1);

  const raw = crypto.randomBytes(48).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expires = new Date(Date.now() + 30 * 864e5);
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (1, ?, ?)',
    [hash, expires],
  );

  const r1 = await post('/auth/refresh', { refreshToken: raw });
  console.log(
    'refresh1',
    r1.status,
    r1.data.success,
    Boolean(r1.data.token),
    Boolean(r1.data.refreshToken),
    Boolean(r1.data.user),
  );

  const rReuse = await post('/auth/refresh', { refreshToken: raw });
  console.log('reuse_old', rReuse.status, rReuse.data.success === false);

  const r2 = await post('/auth/refresh', { refreshToken: r1.data.refreshToken });
  console.log('refresh2_after_reuse_family', r2.status, r2.data.success === false);

  const raw2 = crypto.randomBytes(48).toString('hex');
  const hash2 = crypto.createHash('sha256').update(raw2).digest('hex');
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (1, ?, ?)',
    [hash2, expires],
  );
  const r3 = await post('/auth/refresh', { refreshToken: raw2 });
  console.log('refresh3', r3.status, r3.data.success, Boolean(r3.data.token));

  const rOut = await post(
    '/auth/logout',
    { refreshToken: r3.data.refreshToken },
    r3.data.token,
  );
  console.log('logout', rOut.status, rOut.data.success);

  const rAfter = await post('/auth/refresh', { refreshToken: r3.data.refreshToken });
  console.log('refresh_after_logout', rAfter.status, rAfter.data.success === false);

  const rBad = await post('/auth/refresh', {});
  console.log('refresh_missing', rBad.status);

  await db.end();
  process.exit(0);
})().catch(async (error) => {
  console.error(error);
  try {
    await db.end();
  } catch {
    // ignore
  }
  process.exit(1);
});
