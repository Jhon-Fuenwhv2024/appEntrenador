/**
 * TiDB cannot ALTER ... ADD AUTO_INCREMENT on existing columns.
 * Rebuild each table whose `id` PK lacks AUTO_INCREMENT (copy → drop → rename).
 *
 *   DB_HOST=... DB_PORT=4000 DB_USER=... DB_PASSWORD=... DB_NAME=coach_db DB_SSL=true \
 *   node scripts/fixTidbAutoIncrement.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

function parseBool(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function injectAutoIncrement(createSql, tableName, tmpName) {
  let sql = createSql.replace(
    new RegExp(`CREATE TABLE \`${tableName}\``, 'i'),
    `CREATE TABLE \`${tmpName}\``,
  );

  // `id` int NOT NULL  →  `id` int NOT NULL AUTO_INCREMENT
  // (avoid double-injecting if already present)
  if (!/`id`[^,\n]*AUTO_INCREMENT/i.test(sql)) {
    sql = sql.replace(
      /`id`(\s+)(int(?:\(\d+\))?|bigint(?:\(\d+\))?)(\s+unsigned)?(\s+NOT NULL)?/i,
      (match, sp1, typ, unsigned, notNull) => {
        const nn = notNull || ' NOT NULL';
        return `\`${'id'}\`${sp1}${typ}${unsigned || ''}${nn} AUTO_INCREMENT`;
      },
    );
  }

  // Strip leftover AUTO_INCREMENT=N on table options if any; we'll set after copy
  return sql;
}

async function main() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'coach_db';
  const port = Number(process.env.DB_PORT) || 4000;
  const useSsl = parseBool(process.env.DB_SSL, /tidbcloud\.com$/i.test(host || ''));

  if (!host || !user || password == null || password === '') {
    console.error('Set DB_HOST, DB_USER, DB_PASSWORD');
    process.exit(1);
  }

  const config = {
    host,
    user,
    password,
    database,
    port,
    connectTimeout: 60000,
  };
  if (useSsl) {
    config.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: parseBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
    };
  }

  console.log(`Connecting ${user}@${host}:${port}/${database}`);
  const conn = await mysql.createConnection(config);

  const [cols] = await conn.query(`
    SELECT TABLE_NAME, EXTRA, COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND COLUMN_NAME = 'id'
      AND COLUMN_KEY = 'PRI'
    ORDER BY TABLE_NAME
  `);

  const needFix = cols.filter(
    (c) => !String(c.EXTRA || '').toLowerCase().includes('auto_increment'),
  );

  console.log(`Tables needing rebuild: ${needFix.length}`);
  if (needFix.length === 0) {
    await conn.end();
    return;
  }

  await conn.query('SET FOREIGN_KEY_CHECKS=0');

  for (const col of needFix) {
    const table = col.TABLE_NAME;
    const tmp = `${table}__ai_fix`;
    console.log(`\n=== Rebuilding ${table} ===`);

    try {
      await conn.query(`DROP TABLE IF EXISTS \`${tmp}\``);

      const [createRows] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
      const createSql = createRows[0]['Create Table'] || createRows[0]['CREATE TABLE'];
      const newCreate = injectAutoIncrement(createSql, table, tmp);

      if (!/`id`[^,\n]*AUTO_INCREMENT/i.test(newCreate)) {
        throw new Error('Failed to inject AUTO_INCREMENT into CREATE TABLE');
      }

      await conn.query(newCreate);

      const [countBefore] = await conn.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
      await conn.query(`INSERT INTO \`${tmp}\` SELECT * FROM \`${table}\``);
      const [countAfter] = await conn.query(`SELECT COUNT(*) AS c FROM \`${tmp}\``);

      if (Number(countBefore[0].c) !== Number(countAfter[0].c)) {
        throw new Error(
          `Row count mismatch: before=${countBefore[0].c} after=${countAfter[0].c}`,
        );
      }

      await conn.query(`DROP TABLE \`${table}\``);
      await conn.query(`RENAME TABLE \`${tmp}\` TO \`${table}\``);

      const [maxRows] = await conn.query(
        `SELECT COALESCE(MAX(id), 0) AS m FROM \`${table}\``,
      );
      const next = Number(maxRows[0].m) + 1;
      await conn.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = ${next}`);

      console.log(`OK ${table} rows=${countAfter[0].c} next_id=${next}`);
    } catch (e) {
      console.error(`FAIL ${table}:`, e.message);
      try {
        await conn.query(`DROP TABLE IF EXISTS \`${tmp}\``);
      } catch {
        // ignore
      }
    }
  }

  await conn.query('SET FOREIGN_KEY_CHECKS=1');

  const [after] = await conn.query(`
    SELECT TABLE_NAME, EXTRA
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND COLUMN_NAME = 'id'
      AND COLUMN_KEY = 'PRI'
    ORDER BY TABLE_NAME
  `);
  console.log('\n--- AFTER ---');
  let missing = 0;
  for (const c of after) {
    const ok = String(c.EXTRA || '').toLowerCase().includes('auto_increment');
    console.log(`${ok ? 'OK' : 'MISSING'} ${c.TABLE_NAME}: ${c.EXTRA || '(none)'}`);
    if (!ok) missing += 1;
  }

  // Smoke insert/rollback on weekly_checkins
  try {
    const [ins] = await conn.query(
      `INSERT INTO weekly_checkins
        (client_id, created_at, sleep_quality, stress_level, diet_adherence, notes)
       VALUES (5, '2099-01-01', 1, 1, 1, 'ai-fix-smoke')`,
    );
    await conn.query(`DELETE FROM weekly_checkins WHERE id = ?`, [ins.insertId]);
    console.log('\nSmoke INSERT weekly_checkins OK insertId=', ins.insertId);
  } catch (e) {
    console.error('\nSmoke INSERT FAILED:', e.message);
  }

  await conn.end();
  if (missing > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
