const assert = require('node:assert/strict');
const test = require('node:test');

const dbModulePath = require.resolve('../src/config/db');
const serviceModulePath = require.resolve(
  '../src/modules/workout-sessions/workout-sessions.service',
);

function loadServiceWithDb(db) {
  delete require.cache[serviceModulePath];
  require.cache[dbModulePath] = {
    id: dbModulePath,
    filename: dbModulePath,
    loaded: true,
    exports: db,
  };
  return require(serviceModulePath);
}

test('preserves a completed session when its routine was deleted', async () => {
  let insertedSessionParams;
  let committed = false;
  let rolledBack = false;
  let released = false;

  const connection = {
    async beginTransaction() {},
    async query(sql, params) {
      if (sql.includes('FROM rutinas')) {
        assert.match(sql, /FOR UPDATE/);
        return [[]];
      }
      if (sql.includes('INSERT INTO workout_sessions')) {
        insertedSessionParams = params;
        return [{ insertId: 41 }];
      }
      if (sql.includes('FROM ejercicios')) {
        return [[]];
      }
      if (sql.includes('INSERT INTO workout_set_logs')) {
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected connection query: ${sql}`);
    },
    async commit() {
      committed = true;
    },
    async rollback() {
      rolledBack = true;
    },
    release() {
      released = true;
    },
  };

  const db = {
    async getConnection() {
      return connection;
    },
    async query(sql) {
      if (sql.includes('FROM workout_sessions')) {
        return [[{
          id: 41,
          client_id: 7,
          routine_id: null,
          routine_name: 'Piernas',
          started_at: null,
          finished_at: new Date('2026-07-14T12:00:00Z'),
          status: 'completed',
          created_at: new Date('2026-07-14T12:00:00Z'),
        }]];
      }
      if (sql.includes('FROM workout_set_logs')) {
        return [[{
          id: 51,
          exercise_id: null,
          exercise_name: 'Sentadilla',
          set_number: 1,
          weight: '40.00',
          reps: 10,
          created_at: new Date('2026-07-14T12:00:00Z'),
        }]];
      }
      throw new Error(`Unexpected pool query: ${sql}`);
    },
  };

  const service = loadServiceWithDb(db);
  const result = await service.createMySession(7, {
    routine_id: 12,
    routine_name: 'Piernas',
    status: 'completed',
    sets: [{
      exercise_id: 99,
      exercise_name: 'Sentadilla',
      set_number: 1,
      weight: 40,
      reps: 10,
    }],
  });

  assert.equal(insertedSessionParams[0], 7);
  assert.equal(insertedSessionParams[1], null);
  assert.equal(insertedSessionParams[2], 'Piernas');
  assert.equal(result.routine_id, null);
  assert.equal(result.sets[0].exercise_id, null);
  assert.equal(committed, true);
  assert.equal(rolledBack, false);
  assert.equal(released, true);
});

test('still rejects a live routine owned by another client', async () => {
  let inserted = false;
  let rolledBack = false;
  let released = false;

  const connection = {
    async beginTransaction() {},
    async query(sql) {
      if (sql.includes('FROM rutinas')) {
        return [[{ id: 12, alumno_id: 99, nombre_rutina: 'Ajena' }]];
      }
      inserted = true;
      throw new Error(`Unexpected connection query: ${sql}`);
    },
    async commit() {},
    async rollback() {
      rolledBack = true;
    },
    release() {
      released = true;
    },
  };

  const service = loadServiceWithDb({
    async getConnection() {
      return connection;
    },
  });

  await assert.rejects(
    service.createMySession(7, {
      routine_id: 12,
      routine_name: 'Ajena',
      sets: [{
        exercise_name: 'Press',
        set_number: 1,
        weight: 20,
        reps: 8,
      }],
    }),
    (error) => error.code === 403,
  );

  assert.equal(inserted, false);
  assert.equal(rolledBack, true);
  assert.equal(released, true);
});
