/**
 * One-shot: añade is_superadmin + planes SaaS si faltan.
 * Usage (desde appEntrenador/backend):
 *   npm run db:add-saas-plans
 *   node scripts/addSaasSuperadminAndPlans.js
 */
const path = require('path');
const pool = require('../src/config/db');

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.cnt) > 0;
}

async function tableExists(connection, table) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [table],
  );
  return Number(rows[0]?.cnt) > 0;
}

async function ensureTrainersInfoTable(connection) {
  if (await tableExists(connection, 'trainers_info')) return;

  console.log('[addSaasSuperadminAndPlans] Creando tabla trainers_info (faltaba)...');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS trainers_info (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      telefono VARCHAR(20) NULL,
      foto_url VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_trainers_info_user (user_id),
      CONSTRAINT fk_trainers_info_user
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
}

async function main() {
  let connection;
  try {
    connection = await pool.getConnection();
  } catch (err) {
    console.error('[addSaasSuperadminAndPlans] No se pudo conectar a MySQL.');
    console.error('  Revisa:');
    console.error('  1) XAMPP/MySQL está encendido');
    console.error('  2) Existe la base coach_db');
    console.error('  3) En backend/src/config/db.js user=root password=\'\' (o tu password real)');
    console.error('  Detalle:', err.code || '', err.message);
    process.exitCode = 1;
    await pool.end().catch(() => {});
    return;
  }

  try {
    const [[dbRow]] = await connection.query('SELECT DATABASE() AS db');
    console.log(`[addSaasSuperadminAndPlans] Conectado a base: ${dbRow.db || '(ninguna)'}`);

    if (!dbRow.db) {
      throw new Error('No hay base de datos seleccionada. Configura database: "coach_db" en src/config/db.js');
    }

    if (!(await tableExists(connection, 'usuarios'))) {
      throw new Error(
        'No existe la tabla usuarios. Importa primero backend/db/script_db.sql en phpMyAdmin.',
      );
    }

    await ensureTrainersInfoTable(connection);

    if (!(await columnExists(connection, 'usuarios', 'is_superadmin'))) {
      await connection.query(
        `ALTER TABLE usuarios
         ADD COLUMN is_superadmin BOOLEAN NOT NULL DEFAULT FALSE`,
      );
      console.log('[addSaasSuperadminAndPlans] OK: usuarios.is_superadmin');
    } else {
      console.log('[addSaasSuperadminAndPlans] usuarios.is_superadmin ya existe — omitido.');
    }

    if (!(await columnExists(connection, 'trainers_info', 'saas_plan'))) {
      await connection.query(
        `ALTER TABLE trainers_info
         ADD COLUMN saas_plan ENUM('FREE', 'PRO') NOT NULL DEFAULT 'FREE'`,
      );
      console.log('[addSaasSuperadminAndPlans] OK: trainers_info.saas_plan');
    } else {
      console.log('[addSaasSuperadminAndPlans] trainers_info.saas_plan ya existe — omitido.');
    }

    if (!(await columnExists(connection, 'trainers_info', 'saas_expiration_date'))) {
      await connection.query(
        `ALTER TABLE trainers_info
         ADD COLUMN saas_expiration_date DATE NULL`,
      );
      console.log('[addSaasSuperadminAndPlans] OK: trainers_info.saas_expiration_date');
    } else {
      console.log('[addSaasSuperadminAndPlans] trainers_info.saas_expiration_date ya existe — omitido.');
    }

    console.log('[addSaasSuperadminAndPlans] Columnas SaaS listas.');
    console.log('');
    console.log('Siguiente paso (SuperAdmin), en phpMyAdmin / MySQL:');
    console.log('  SELECT id, username, rol FROM usuarios WHERE rol = \'trainer\';');
    console.log('  UPDATE usuarios SET is_superadmin = TRUE WHERE id = <TU_ID>;');
    console.log('Luego cierra sesión en la app e inicia sesión otra vez.');
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

main().catch(async (err) => {
  console.error('[addSaasSuperadminAndPlans] Error:', err.message);
  if (err.code) console.error('  Código MySQL:', err.code);
  if (err.sqlMessage) console.error('  SQL:', err.sqlMessage);
  process.exitCode = 1;
  await pool.end().catch(() => {});
});
