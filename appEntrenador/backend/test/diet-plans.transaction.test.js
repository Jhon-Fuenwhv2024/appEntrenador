const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');

const dbPath = path.resolve(__dirname, '../src/config/db.js');
const clientsServicePath = path.resolve(
  __dirname,
  '../src/modules/clients/clients.service.js',
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
      if (sql.includes('INSERT INTO nutrition_targets')) {
        throw syncError;
      }
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
              calories: 300,
              protein_g: 20,
              carbs_g: 30,
              fats_g: 10,
            },
          ],
        },
      ],
    }),
    syncError,
  );

  assert.ok(events.some((event) => event.startsWith('UPDATE diet_plans')));
  const syncIndex = events.findIndex((event) =>
    event.startsWith('INSERT INTO nutrition_targets'),
  );
  assert.ok(syncIndex > -1);
  assert.ok(syncIndex < events.indexOf('rollback'));
  assert.ok(!events.includes('commit'));
  assert.equal(events.at(-1), 'release');
});
