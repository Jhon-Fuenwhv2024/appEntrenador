/**
 * Import phpMyAdmin / mysqldump SQL into TiDB (or any MySQL-compatible host).
 *
 * Usage (from backend/):
 *   set DB_HOST=...
 *   set DB_PORT=4000
 *   set DB_USER=...
 *   set DB_PASSWORD=...
 *   set DB_NAME=coach_db
 *   set DB_SSL=true
 *   node scripts/importSqlDump.js db/coach_db.sql
 *
 * Drops existing tables in DB_NAME, then runs the dump statement-by-statement.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function parseBool(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function splitStatements(sql) {
  const stmts = [];
  let cur = '';
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let escaped = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];

    if (escaped) {
      cur += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\' && (inSingle || inDouble)) {
      cur += ch;
      escaped = true;
      continue;
    }

    if (!inDouble && !inBacktick && ch === "'") {
      inSingle = !inSingle;
      cur += ch;
      continue;
    }
    if (!inSingle && !inBacktick && ch === '"') {
      inDouble = !inDouble;
      cur += ch;
      continue;
    }
    if (!inSingle && !inDouble && ch === '`') {
      inBacktick = !inBacktick;
      cur += ch;
      continue;
    }

    if (ch === ';' && !inSingle && !inDouble && !inBacktick) {
      const trimmed = cur.trim();
      if (trimmed) stmts.push(trimmed);
      cur = '';
      continue;
    }

    cur += ch;
  }

  const tail = cur.trim();
  if (tail) stmts.push(tail);
  return stmts;
}

function preprocessDump(raw) {
  let sql = raw.replace(/\r\n/g, '\n');
  // Strip /*!##### ... */ MySQL versioned comments (keep inner if needed — drop whole block).
  sql = sql.replace(/\/\*![0-9]{5}[\s\S]*?\*\//g, '');
  // Strip block comments
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  // Strip line comments
  sql = sql
    .split('\n')
    .filter((line) => !/^\s*--/.test(line))
    .join('\n');
  return sql;
}

function shouldSkip(stmt) {
  const s = stmt.trim().toUpperCase();
  if (!s) return true;
  if (s.startsWith('CREATE DATABASE')) return true;
  if (s.startsWith('USE ')) return true;
  if (s.startsWith('START TRANSACTION')) return true;
  if (s === 'COMMIT') return true;
  if (s.startsWith('LOCK TABLES')) return true;
  if (s.startsWith('UNLOCK TABLES')) return true;
  return false;
}

async function main() {
  const dumpArg = process.argv[2] || 'db/coach_db.sql';
  const dumpPath = path.resolve(process.cwd(), dumpArg);

  if (!fs.existsSync(dumpPath)) {
    console.error(`Dump not found: ${dumpPath}`);
    process.exit(1);
  }

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'coach_db';
  const port = Number(process.env.DB_PORT) || 4000;
  const useSsl = parseBool(process.env.DB_SSL, /tidbcloud\.com$/i.test(host || ''));

  if (!host || !user || password == null || password === '') {
    console.error('Set DB_HOST, DB_USER, DB_PASSWORD (and optionally DB_NAME, DB_PORT, DB_SSL).');
    process.exit(1);
  }

  const config = {
    host,
    user,
    password,
    database,
    port,
    multipleStatements: false,
    connectTimeout: 30000,
  };
  if (useSsl) {
    config.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: parseBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
    };
  }

  console.log(`Connecting ${user}@${host}:${port}/${database} ssl=${useSsl}`);
  const conn = await mysql.createConnection(config);

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS=0');

    const [tables] = await conn.query(
      `SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ?`,
      [database],
    );
    for (const row of tables) {
      const name = row.name || row.TABLE_NAME || row.Name;
      console.log(`DROP TABLE ${name}`);
      await conn.query(`DROP TABLE IF EXISTS \`${name}\``);
    }

    const raw = fs.readFileSync(dumpPath, 'utf8');
    const stmts = splitStatements(preprocessDump(raw));
    let ok = 0;
    const failures = [];

    for (const stmt of stmts) {
      if (shouldSkip(stmt)) continue;
      try {
        await conn.query(stmt);
        ok += 1;
      } catch (err) {
        failures.push({
          preview: stmt.slice(0, 140).replace(/\s+/g, ' '),
          message: err.message,
          code: err.code,
        });
        console.error('FAIL:', err.code, err.message);
        console.error(' SQL:', stmt.slice(0, 140).replace(/\s+/g, ' '));
      }
    }

    await conn.query('SET FOREIGN_KEY_CHECKS=1');

    const [[u]] = await conn.query('SELECT COUNT(*) AS n FROM usuarios');
    const [[e]] = await conn.query('SELECT COUNT(*) AS n FROM exercises');
    const [[r]] = await conn.query('SELECT COUNT(*) AS n FROM rutinas');
    const [users] = await conn.query('SELECT id, username, rol FROM usuarios ORDER BY id');

    console.log(JSON.stringify({
      ok,
      fail: failures.length,
      counts: { usuarios: u.n, exercises: e.n, rutinas: r.n },
      users,
      failures,
    }, null, 2));

    if (/tidbcloud\.com$/i.test(host || '')) {
      console.log('\nTiDB detectado: los ALTER AUTO_INCREMENT del dump NO funcionan vía MODIFY.');
      console.log('Ejecuta ahora: node scripts/fixTidbAutoIncrement.js');
    }

    if (failures.length) process.exitCode = 2;
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Import aborted:', err.code || '', err.message);
  process.exit(1);
});
