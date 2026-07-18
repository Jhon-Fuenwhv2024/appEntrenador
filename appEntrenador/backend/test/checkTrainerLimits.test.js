const assert = require('node:assert/strict');
const test = require('node:test');

const dbPath = require.resolve('../src/config/db');
const middlewarePath = require.resolve('../src/middleware/checkTrainerLimits');

let queryHandler;
const db = {
  query(...args) {
    return queryHandler(...args);
  },
};

require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: db,
};
delete require.cache[middlewarePath];
const checkTrainerLimits = require(middlewarePath);

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('expired PRO plans are subject to the FREE slot limit', async () => {
  const queries = [];
  queryHandler = async (sql) => {
    queries.push(sql);
    if (queries.length === 1) {
      return [[{
        saas_plan: 'PRO',
        has_active_pro_plan: 0,
      }]];
    }
    return [[{ count: queries.length === 2 ? 3 : 0 }]];
  };

  const res = createResponse();
  let nextCalled = false;
  await checkTrainerLimits(
    { user: { id: 42 } },
    res,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 402);
  assert.equal(res.body.error, 'LIMIT_EXCEEDED');
  assert.equal(queries.length, 3);
  assert.match(queries[0], /saas_expiration_date >= CURDATE\(\)/);
});

test('active PRO plans bypass the FREE slot count', async () => {
  let queryCount = 0;
  queryHandler = async () => {
    queryCount += 1;
    return [[{
      saas_plan: 'PRO',
      has_active_pro_plan: 1,
    }]];
  };

  const res = createResponse();
  let nextCalled = false;
  await checkTrainerLimits(
    { user: { id: 42 } },
    res,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, true);
  assert.equal(res.body, null);
  assert.equal(queryCount, 1);
});

test('FREE plans below the slot limit can create an invite', async () => {
  let queryCount = 0;
  queryHandler = async () => {
    queryCount += 1;
    if (queryCount === 1) {
      return [[{
        saas_plan: 'FREE',
        has_active_pro_plan: 0,
      }]];
    }
    return [[{ count: queryCount === 2 ? 1 : 0 }]];
  };

  const res = createResponse();
  let nextCalled = false;
  await checkTrainerLimits(
    { user: { id: 42 } },
    res,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, true);
  assert.equal(res.body, null);
  assert.equal(queryCount, 3);
});
