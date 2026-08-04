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
 * Feature 085 — JSON set_prescription on ejercicios + template_exercises.
 * Idempotent for existing DBs.
 */
async function ensureSetPrescriptionColumns() {
  if (await tableExists('ejercicios')) {
    if (!(await columnExists('ejercicios', 'set_prescription'))) {
      await db.query(
        `ALTER TABLE ejercicios
         ADD COLUMN set_prescription JSON NULL
         COMMENT 'Prescripción por serie [{set,reps,weight}] Feature 085'
         AFTER peso`,
      );
    }
  }

  if (await tableExists('template_exercises')) {
    if (!(await columnExists('template_exercises', 'set_prescription'))) {
      await db.query(
        `ALTER TABLE template_exercises
         ADD COLUMN set_prescription JSON NULL
         COMMENT 'Prescripción por serie [{set,reps,weight}] Feature 085'
         AFTER peso`,
      );
    }
  }
}

module.exports = { ensureSetPrescriptionColumns };
