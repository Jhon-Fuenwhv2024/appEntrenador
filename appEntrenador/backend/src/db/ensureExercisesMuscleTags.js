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
 * Asegura columnas HITL en `exercises` (músculos + calentamiento).
 * Idempotente para DBs ya existentes.
 */
async function ensureExercisesMuscleTags() {
  if (!(await tableExists('exercises'))) {
    return;
  }

  const columns = [
    {
      name: 'primary_muscle',
      ddl: `ALTER TABLE exercises
            ADD COLUMN primary_muscle VARCHAR(100) NULL
            COMMENT 'Músculo principal (taxonomía HITL)'
            AFTER target_muscle_es`,
    },
    {
      name: 'secondary_muscles',
      ddl: `ALTER TABLE exercises
            ADD COLUMN secondary_muscles JSON NULL
            COMMENT 'Músculos secundarios (array JSON de strings)'
            AFTER primary_muscle`,
    },
    {
      name: 'is_warmup',
      ddl: `ALTER TABLE exercises
            ADD COLUMN is_warmup TINYINT(1) NOT NULL DEFAULT 0
            COMMENT '1 = usable como calentamiento para el músculo etiquetado'
            AFTER secondary_muscles`,
    },
  ];

  for (const col of columns) {
    if (!(await columnExists('exercises', col.name))) {
      await db.query(col.ddl);
    }
  }
}

module.exports = { ensureExercisesMuscleTags };
