const assert = require('node:assert/strict');
const { test } = require('node:test');

const { rebuildTable } = require('./fixTidbAutoIncrement');

function createConnection({ failOn } = {}) {
  const queries = [];

  return {
    queries,
    async query(sql) {
      queries.push(sql);
      if (failOn?.(sql)) {
        throw new Error('simulated database failure');
      }
      if (sql === 'SHOW CREATE TABLE `users`') {
        return [[{ 'Create Table': 'CREATE TABLE `users` (`id` int NOT NULL, PRIMARY KEY (`id`))' }]];
      }
      if (sql === 'SELECT COUNT(*) AS c FROM `users`') return [[{ c: 2 }]];
      if (sql === 'SELECT COUNT(*) AS c FROM `users__ai_fix`') return [[{ c: 2 }]];
      if (sql === 'SELECT COALESCE(MAX(id), 0) AS m FROM `users`') return [[{ m: 8 }]];
      return [{}];
    },
  };
}

test('atomically swaps the rebuilt table before deleting the backup', async () => {
  const conn = createConnection();

  const result = await rebuildTable(conn, 'users');

  assert.deepEqual(result, { rows: 2, next: 9 });
  assert.ok(
    conn.queries.includes(
      'RENAME TABLE `users` TO `users__ai_backup`, `users__ai_fix` TO `users`',
    ),
  );
  assert.ok(conn.queries.includes('DROP TABLE `users__ai_backup`'));
  assert.ok(!conn.queries.includes('DROP TABLE `users`'));
});

test('keeps the original table when the atomic swap fails', async () => {
  const conn = createConnection({
    failOn: (sql) => sql.startsWith('RENAME TABLE `users` TO `users__ai_backup`'),
  });

  await assert.rejects(() => rebuildTable(conn, 'users'), /simulated database failure/);

  assert.ok(conn.queries.includes('DROP TABLE IF EXISTS `users__ai_fix`'));
  assert.ok(!conn.queries.includes('DROP TABLE `users`'));
  assert.ok(!conn.queries.includes('DROP TABLE `users__ai_backup`'));
});

test('restores the original table when post-swap validation fails', async () => {
  const conn = createConnection({
    failOn: (sql) => sql.startsWith('ALTER TABLE `users` AUTO_INCREMENT'),
  });

  await assert.rejects(() => rebuildTable(conn, 'users'), /simulated database failure/);

  assert.ok(
    conn.queries.includes(
      'RENAME TABLE `users` TO `users__ai_fix`, `users__ai_backup` TO `users`',
    ),
  );
  assert.equal(
    conn.queries.filter((sql) => sql === 'DROP TABLE IF EXISTS `users__ai_fix`').length,
    2,
  );
  assert.ok(!conn.queries.includes('DROP TABLE `users__ai_backup`'));
});
