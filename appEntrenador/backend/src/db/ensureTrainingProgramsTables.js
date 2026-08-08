const db = require('../config/db');

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.c) > 0;
}

async function constraintExists(name) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS c
     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND CONSTRAINT_NAME = ?`,
    [name],
  );
  return Number(rows[0]?.c) > 0;
}

/**
 * Feature 091 — Periodización: programas / fases / semanas / días / exercises + assignments.
 */
async function ensureTrainingProgramsTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS training_programs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trainer_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      goal TEXT NULL,
      planned_weeks TINYINT NULL,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_training_programs_trainer (trainer_id),
      CONSTRAINT fk_training_programs_trainer
        FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS program_phases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      program_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      phase_type ENUM(
        'hypertrophy', 'strength', 'power', 'deload', 'peak', 'conditioning', 'custom'
      ) NOT NULL DEFAULT 'custom',
      intensity_focus ENUM('volume', 'intensity', 'recovery', 'mixed') NOT NULL DEFAULT 'mixed',
      sort_order TINYINT NOT NULL DEFAULT 0,
      duration_weeks TINYINT NOT NULL DEFAULT 4,
      notes TEXT NULL,
      INDEX idx_program_phases_program (program_id),
      CONSTRAINT fk_program_phases_program
        FOREIGN KEY (program_id) REFERENCES training_programs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS program_weeks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phase_id INT NOT NULL,
      week_index TINYINT NOT NULL,
      name VARCHAR(100) NULL,
      progression_rule ENUM('hold', 'same', 'add_weight', 'add_reps', 'deload_pct')
        NOT NULL DEFAULT 'same',
      progression_value DECIMAL(6,2) NULL,
      notes TEXT NULL,
      UNIQUE KEY uq_program_week (phase_id, week_index),
      INDEX idx_program_weeks_phase (phase_id),
      CONSTRAINT fk_program_weeks_phase
        FOREIGN KEY (phase_id) REFERENCES program_phases(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS program_days (
      id INT AUTO_INCREMENT PRIMARY KEY,
      week_id INT NOT NULL,
      dia_semana ENUM('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo') NOT NULL,
      name VARCHAR(100) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      UNIQUE KEY uq_program_day (week_id, dia_semana),
      INDEX idx_program_days_week (week_id),
      CONSTRAINT fk_program_days_week
        FOREIGN KEY (week_id) REFERENCES program_weeks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS program_exercises (
      id INT AUTO_INCREMENT PRIMARY KEY,
      program_day_id INT NOT NULL,
      nombre VARCHAR(100) NOT NULL,
      exercise_id INT NULL,
      series INT NOT NULL,
      repeticiones INT NOT NULL,
      peso DECIMAL(6,2) NOT NULL DEFAULT 0,
      set_prescription JSON NULL,
      rest_time_seconds INT NOT NULL DEFAULT 90,
      superset_letter VARCHAR(2) NULL,
      indicaciones TEXT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      INDEX idx_program_exercises_day (program_day_id),
      INDEX idx_program_exercises_exercise (exercise_id),
      CONSTRAINT fk_program_exercises_day
        FOREIGN KEY (program_day_id) REFERENCES program_days(id) ON DELETE CASCADE,
      CONSTRAINT fk_program_exercises_catalog
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS client_program_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      program_id INT NOT NULL,
      phase_id INT NULL,
      start_date DATE NOT NULL,
      status ENUM('active', 'paused', 'completed') NOT NULL DEFAULT 'active',
      current_week_index TINYINT NOT NULL DEFAULT 1,
      progression_mode ENUM('template', 'same_as_last', 'last_plus') NOT NULL DEFAULT 'last_plus',
      progression_increment_kg DECIMAL(6,2) NOT NULL DEFAULT 2.50,
      assigned_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cpa_client (client_id),
      INDEX idx_cpa_program (program_id),
      INDEX idx_cpa_client_status (client_id, status),
      CONSTRAINT fk_cpa_client
        FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      CONSTRAINT fk_cpa_program
        FOREIGN KEY (program_id) REFERENCES training_programs(id) ON DELETE CASCADE,
      CONSTRAINT fk_cpa_phase
        FOREIGN KEY (phase_id) REFERENCES program_phases(id) ON DELETE SET NULL,
      CONSTRAINT fk_cpa_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);

  // Linaje en rutinas
  if (!(await columnExists('rutinas', 'assignment_id'))) {
    await db.query('ALTER TABLE rutinas ADD COLUMN assignment_id INT NULL');
  }
  if (!(await columnExists('rutinas', 'program_day_id'))) {
    await db.query('ALTER TABLE rutinas ADD COLUMN program_day_id INT NULL');
  }
  if (!(await columnExists('rutinas', 'source_week_index'))) {
    await db.query('ALTER TABLE rutinas ADD COLUMN source_week_index TINYINT NULL');
  }
  if (!(await constraintExists('fk_rutinas_assignment'))) {
    try {
      await db.query(`
        ALTER TABLE rutinas
          ADD CONSTRAINT fk_rutinas_assignment
            FOREIGN KEY (assignment_id) REFERENCES client_program_assignments(id) ON DELETE SET NULL
      `);
    } catch (error) {
      console.warn('[ensureTrainingPrograms] fk_rutinas_assignment:', error.message);
    }
  }
  if (!(await constraintExists('fk_rutinas_program_day'))) {
    try {
      await db.query(`
        ALTER TABLE rutinas
          ADD CONSTRAINT fk_rutinas_program_day
            FOREIGN KEY (program_day_id) REFERENCES program_days(id) ON DELETE SET NULL
      `);
    } catch (error) {
      console.warn('[ensureTrainingPrograms] fk_rutinas_program_day:', error.message);
    }
  }

  // Linaje en workout_sessions
  if (!(await columnExists('workout_sessions', 'assignment_id'))) {
    await db.query('ALTER TABLE workout_sessions ADD COLUMN assignment_id INT NULL');
  }
  if (!(await columnExists('workout_sessions', 'program_week_index'))) {
    await db.query('ALTER TABLE workout_sessions ADD COLUMN program_week_index TINYINT NULL');
  }
  if (!(await constraintExists('fk_workout_sessions_assignment'))) {
    try {
      await db.query(`
        ALTER TABLE workout_sessions
          ADD CONSTRAINT fk_workout_sessions_assignment
            FOREIGN KEY (assignment_id) REFERENCES client_program_assignments(id) ON DELETE SET NULL
      `);
    } catch (error) {
      console.warn('[ensureTrainingPrograms] fk_workout_sessions_assignment:', error.message);
    }
  }
}

module.exports = { ensureTrainingProgramsTables };
