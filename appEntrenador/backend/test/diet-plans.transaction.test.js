const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');

const dbPath = path.resolve(__dirname, '../src/config/db.js');
const clientsServicePath = path.resolve(
  __dirname,
  '../src/modules/clients/clients.service.js',
);
const nutritionServicePath = path.resolve(
  __dirname,
  '../src/modules/nutrition/nutrition.service.js',
);

test('rolls back active plan changes when nutrition target sync fails', async () => {
  const events = [];
  const syncError = new Error('nutrition sync failed');
  let nextInsertId = 40;

  const connection = {
    async beginTransaction() {
      events.push('begin');
    },
    async query(sql) {
      events.push(sql.trim().replace(/\s+/g, ' '));
      if (sql.includes('INSERT INTO diet_plans')) {
        return [{ insertId: nextInsertId++ }];
      }
      if (sql.includes('INSERT INTO diet_meals')) {
        return [{ insertId: nextInsertId++ }];
      }
      return [{}];
    },
    async commit() {
      events.push('commit');
    },
    async rollback() {
      events.push('rollback');
    },
    release() {
      events.push('release');
    },
  };

  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      async getConnection() {
        return connection;
      },
      async query() {
        throw new Error('pool query should not run before the transaction commits');
      },
    },
  };
  require.cache[clientsServicePath] = {
    id: clientsServicePath,
    filename: clientsServicePath,
    loaded: true,
    exports: {
      async getClientOwnedByTrainer() {
        return { id: 7 };
      },
    },
  };
  require.cache[nutritionServicePath] = {
    id: nutritionServicePath,
    filename: nutritionServicePath,
    loaded: true,
    exports: {
      async syncFromDietPlanTotals(trainerId, clientId, totals, queryExecutor) {
        assert.equal(trainerId, 3);
        assert.equal(clientId, 7);
        assert.deepEqual(totals, {
          calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fats_g: 0,
        });
        assert.equal(queryExecutor, connection);
        events.push('sync');
        throw syncError;
      },
    },
  };

  const dietPlansService = require('../src/modules/diet-plans/diet-plans.service');

  await assert.rejects(
    dietPlansService.createDietPlan(3, {
      client_id: 7,
      title: 'Plan activo',
      is_active: true,
      meals: [
        {
          name: 'Desayuno',
          items: [
            {
              food_name: 'Café',
              quantity: 1,
              unit: 'taza',
              calories: 0,
              protein_g: 0,
              carbs_g: 0,
              fats_g: 0,
            },
          ],
        },
      ],
    }),
    syncError,
  );

  assert.ok(events.some((event) => event.startsWith('UPDATE diet_plans')));
  assert.ok(events.indexOf('sync') < events.indexOf('rollback'));
  assert.ok(!events.includes('commit'));
  assert.equal(events.at(-1), 'release');
});
