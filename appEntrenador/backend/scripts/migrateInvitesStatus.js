/**
 * One-shot: migrate invitaciones.usado → status (Feature 023).
 * Usage: node scripts/migrateInvitesStatus.js
 * Idempotent if status already exists and usado is gone.
 */
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT 1 AS ok
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column],
  );
  return rows.length > 0;
}

async function main() {
  const connection = await pool.getConnection();

  try {
    const hasStatus = await columnExists(connection, 'invitaciones', 'status');
    const hasUsado = await columnExists(connection, 'invitaciones', 'usado');

    if (hasStatus && !hasUsado) {
      console.log('[migrateInvitesStatus] Ya aplicado (status presente, usado ausente).');
      return;
    }

    if (!hasUsado && !hasStatus) {
      throw new Error('Tabla invitaciones sin columnas usado ni status; revisa el schema.');
    }

    if (!hasStatus && hasUsado) {
      const sqlPath = path.join(__dirname, '../db/migrations/009_invites_status.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      const statements = sql
        .split(';')
        .map((s) => s
          .split('\n')
          .filter((line) => !line.trim().startsWith('--'))
          .join('\n')
          .trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await connection.query(statement);
        console.log(
          '[migrateInvitesStatus] OK:',
          statement.slice(0, 56).replace(/\s+/g, ' '),
          '...',
        );
      }
    } else if (hasStatus && hasUsado) {
      await connection.query(
        "UPDATE invitaciones SET status = 'used' WHERE usado = TRUE AND status = 'pending'",
      );
      await connection.query(
        "UPDATE invitaciones SET status = 'pending' WHERE usado = FALSE AND status = 'pending'",
      );
      await connection.query('ALTER TABLE invitaciones DROP COLUMN usado');
      console.log('[migrateInvitesStatus] Completado drop de usado (status ya existía).');
    }

    console.log('[migrateInvitesStatus] Migración lista.');
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[migrateInvitesStatus] Error:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
