const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const dbPath = require.resolve('../../config/db');
const servicePath = require.resolve('./exercises.service');

function loadService(query) {
  delete require.cache[servicePath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: { query },
  };
  return require(servicePath);
}

afterEach(() => {
  delete require.cache[servicePath];
  delete require.cache[dbPath];
});

const validPayload = {
  name: 'Press banca',
  target_muscle: 'Pecho',
  media_type: 'none',
};

test('rejects updates to global exercises before issuing a write', async () => {
  let queryCount = 0;
  const service = loadService(async () => {
    queryCount += 1;
    return [[{ id: 7, created_by_trainer_id: null }]];
  });

  await assert.rejects(
    service.updateExerciseForTrainer(12, 7, validPayload),
    (error) => error.code === 403 && /solo lectura/.test(error.message),
  );
  assert.equal(queryCount, 1);
});

test('rejects deletion of global exercises before issuing a write', async () => {
  let queryCount = 0;
  const service = loadService(async () => {
    queryCount += 1;
    return [[{ id: 7, created_by_trainer_id: null }]];
  });

  await assert.rejects(
    service.deleteExerciseForTrainer(12, 7),
    (error) => error.code === 403 && /solo lectura/.test(error.message),
  );
  assert.equal(queryCount, 1);
});

test('updates a trainer-owned exercise with an ownership-only predicate', async () => {
  const queries = [];
  const ownedExercise = {
    id: 8,
    name: validPayload.name,
    description: null,
    target_muscle: validPayload.target_muscle,
    media_type: 'none',
    media_url: null,
    created_by_trainer_id: 12,
  };
  const responses = [
    [[ownedExercise]],
    [[]],
    [{ affectedRows: 1 }],
    [[ownedExercise]],
  ];
  const service = loadService(async (sql, params) => {
    queries.push({ sql, params });
    return responses.shift();
  });

  const result = await service.updateExerciseForTrainer(12, 8, validPayload);

  assert.equal(result.id, 8);
  assert.match(queries[2].sql, /AND created_by_trainer_id = \?/);
  assert.doesNotMatch(queries[2].sql, /created_by_trainer_id IS NULL/);
  assert.deepEqual(queries[2].params.slice(-2), [8, 12]);
});

test('deletes a trainer-owned exercise with an ownership-only predicate', async () => {
  const queries = [];
  const responses = [
    [[{ id: 8, created_by_trainer_id: 12 }]],
    [{ affectedRows: 1 }],
  ];
  const service = loadService(async (sql, params) => {
    queries.push({ sql, params });
    return responses.shift();
  });

  const result = await service.deleteExerciseForTrainer(12, 8);

  assert.deepEqual(result, { id: 8 });
  assert.match(queries[1].sql, /AND created_by_trainer_id = \?/);
  assert.doesNotMatch(queries[1].sql, /created_by_trainer_id IS NULL/);
  assert.deepEqual(queries[1].params, [8, 12]);
});
