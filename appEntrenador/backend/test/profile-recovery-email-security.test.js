const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/config/db');
const profileService = require('../src/modules/profile/profile.service');

test('trainer cannot replace a client recovery email', async (t) => {
  const originalQuery = db.query;
  const originalGetConnection = db.getConnection;
  let transactionStarted = false;

  t.after(() => {
    db.query = originalQuery;
    db.getConnection = originalGetConnection;
  });

  db.query = async (sql, params) => {
    assert.match(sql, /FROM usuarios/);
    assert.deepEqual(params, [42]);
    return [[{
      id: 42,
      nombre: 'Cliente',
      username: 'cliente',
      email: 'cliente@example.com',
      rol: 'client',
      trainer_id: 7,
    }]];
  };

  db.getConnection = async () => {
    transactionStarted = true;
    throw new Error('No debe abrir una transacción para un cambio no autorizado');
  };

  await assert.rejects(
    profileService.upsertProfile(
      { id: 7, rol: 'trainer' },
      42,
      { email: 'attacker@example.com', objetivo: 'Fuerza' },
      null,
    ),
    (error) => {
      assert.equal(error.code, 403);
      assert.match(error.message, /Solo el cliente/);
      return true;
    },
  );

  assert.equal(transactionStarted, false);
});
