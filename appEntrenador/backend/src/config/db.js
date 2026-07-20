// src/config/db.js
const mysql = require('mysql2');

function parseBool(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const host = process.env.DB_HOST || 'localhost';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD ?? '';
const database = process.env.DB_NAME || 'coach_db';
const port = Number(process.env.DB_PORT) || 3306;
const looksLikeTidb = /tidbcloud\.com$/i.test(host);
const useSsl = parseBool(process.env.DB_SSL, looksLikeTidb);

const poolConfig = {
  host,
  user,
  password,
  database,
  port,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
};

if (useSsl) {
  // TiDB Cloud / managed MySQL: TLS required. If handshake fails on Render,
  // set DB_SSL_REJECT_UNAUTHORIZED=false temporarily.
  poolConfig.ssl = {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: parseBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
  };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool.promise();
