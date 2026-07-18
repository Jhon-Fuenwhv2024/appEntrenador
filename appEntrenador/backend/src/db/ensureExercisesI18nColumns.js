const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.cnt) > 0;
}

async function tableExists(table) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [table],
  );
  return Number(rows[0]?.cnt) > 0;
}

/**
 * Asegura columnas i18n + local_media_path en `exercises` (Feature 044).
 * Idempotente para DBs ya existentes.
 */
async function ensureExercisesI18nColumns() {
  if (!(await tableExists('exercises'))) {
    return;
  }

  const columns = [
    {
      name: 'name_es',
      ddl: `ALTER TABLE exercises
            ADD COLUMN name_es VARCHAR(150) NULL
            COMMENT 'Nombre en español (scraping Fitcron)'
            AFTER name`,
    },
    {
      name: 'description_es',
      ddl: `ALTER TABLE exercises
            ADD COLUMN description_es TEXT NULL
            COMMENT 'Descripción en español (scraping Fitcron)'
            AFTER description`,
    },
    {
      name: 'local_media_path',
      ddl: `ALTER TABLE exercises
            ADD COLUMN local_media_path VARCHAR(500) NULL
            COMMENT 'Ruta relativa local, ej. /uploads/exercises/exercise_12.gif'
            AFTER media_url`,
    },
    {
      name: 'target_muscle_es',
      ddl: `ALTER TABLE exercises
            ADD COLUMN target_muscle_es VARCHAR(100) NULL
            COMMENT 'Grupo muscular en español (opcional)'
            AFTER target_muscle`,
    },
  ];

  for (const col of columns) {
    if (!(await columnExists('exercises', col.name))) {
      await db.query(col.ddl);
    }
  }
}

function ensureExercisesMediaDir() {
  const dir = path.join(__dirname, '../../public/uploads/exercises');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = {
  ensureExercisesI18nColumns,
  ensureExercisesMediaDir,
};
