-- 1. Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS coach_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE coach_db;

-- 2. TABLA DE USUARIOS (Login + ownership trainer↔cliente)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol ENUM('trainer', 'client') NOT NULL DEFAULT 'client',
    trainer_id INT NULL,
    is_superadmin BOOLEAN NOT NULL DEFAULT FALSE
      COMMENT 'Flag plataforma SuperAdmin (Feature 037); no es un tercer rol',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_trainer
      FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. TABLA DE INFORMACIÓN EXTRA DEL ALUMNO (1:1 con usuarios)
CREATE TABLE alumnos_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    telefono VARCHAR(20) NULL,
    fecha_nacimiento DATE NULL,
    sexo ENUM('Masculino', 'Femenino', 'Otro') NULL,
    lesiones TEXT NULL,
    objetivo VARCHAR(100) NULL,
    foto_url VARCHAR(255) NULL,
    ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_alumnos_info_user (user_id),
    CONSTRAINT fk_alumnos_info_user
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3b. PERFIL EXTENDIDO DEL ENTRENADOR (1:1 con usuarios)
CREATE TABLE trainers_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    telefono VARCHAR(20) NULL,
    foto_url VARCHAR(255) NULL,
    saas_plan ENUM('FREE', 'PRO') NOT NULL DEFAULT 'FREE'
      COMMENT 'Plan SaaS B2B del entrenador (Feature 037)',
    saas_expiration_date DATE NULL
      COMMENT 'Vencimiento del plan PRO; NULL = sin fecha',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_trainers_info_user (user_id),
    CONSTRAINT fk_trainers_info_user
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. TABLA DE RUTINAS DIARIAS
CREATE TABLE rutinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT NOT NULL,
    dia_semana ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo') NOT NULL,
    nombre_rutina VARCHAR(100) NOT NULL,
    FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. TABLA DE EJERCICIOS DETALLADOS
-- exercise_id: vínculo opcional al catálogo `exercises` (Feature 022).
-- La FK se añade tras crear `exercises` (más abajo) por orden de dependencias.
CREATE TABLE ejercicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rutina_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    exercise_id INT NULL,
    series INT NOT NULL,
    repeticiones INT NOT NULL,
    indicaciones TEXT,
    peso DECIMAL(6,2) NOT NULL,
    rest_time_seconds INT NOT NULL DEFAULT 90
      COMMENT 'Descanso entre series (segundos); Feature 028',
    superset_letter VARCHAR(2) NULL
      COMMENT 'Grupo superserie/circuito (A, B) - Feature 029',
    INDEX idx_ejercicios_exercise (exercise_id),
    FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. TABLA DE INVITACIONES PARA REGISTRO
-- status: pending | used | revoked (Feature 023)
CREATE TABLE invitaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
      COMMENT 'pending|used|revoked',
    trainer_id INT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invitaciones_trainer
      FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. CATÁLOGO DE EJERCICIOS (diccionario híbrido: globales + por trainer)
-- Distinto de `ejercicios` (líneas de una rutina con series/reps/peso).
-- Globales: created_by_trainer_id IS NULL. Privados: ID del trainer en usuarios.
-- Seed global: scripts/seedExercises.js (clone local wrkout/exercises.json; media_url = raw GitHub).
CREATE TABLE exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    name_es VARCHAR(150) NULL COMMENT 'Nombre en español (scraping Fitcron)',
    description TEXT NULL,
    description_es TEXT NULL COMMENT 'Descripción en español (scraping Fitcron)',
    target_muscle VARCHAR(100) NOT NULL,
    target_muscle_es VARCHAR(100) NULL COMMENT 'Grupo muscular en español (opcional)',
    media_type ENUM('image', 'gif', 'youtube', 'video', 'none') NOT NULL DEFAULT 'none',
    media_url VARCHAR(500) NULL,
    local_media_path VARCHAR(500) NULL COMMENT 'Ruta relativa local, ej. /uploads/exercises/exercise_12.gif',
    created_by_trainer_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_exercises_name (name),
    INDEX idx_exercises_trainer (created_by_trainer_id),
    CONSTRAINT fk_exercises_trainer
      FOREIGN KEY (created_by_trainer_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Feature 022: vínculo estable rutina → catálogo (ON DELETE SET NULL = historial intacto)
ALTER TABLE ejercicios
  ADD CONSTRAINT fk_ejercicios_catalog_exercise
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL;

-- 8. SESIONES DE ENTRENAMIENTO (ejecución; no muta la prescripción en ejercicios)
CREATE TABLE workout_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    routine_id INT NULL,
    routine_name VARCHAR(100) NOT NULL,
    started_at DATETIME NULL,
    finished_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('completed', 'abandoned') NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workout_sessions_client (client_id),
    INDEX idx_workout_sessions_finished (finished_at),
    CONSTRAINT fk_workout_sessions_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_workout_sessions_routine
      FOREIGN KEY (routine_id) REFERENCES rutinas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 9. LOGS POR SERIE
CREATE TABLE workout_set_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    exercise_id INT NULL,
    exercise_name VARCHAR(150) NOT NULL,
    set_number INT NOT NULL,
    weight DECIMAL(6,2) NOT NULL,
    reps INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workout_set_logs_session (session_id),
    CONSTRAINT fk_workout_set_logs_session
      FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_workout_set_logs_exercise
      FOREIGN KEY (exercise_id) REFERENCES ejercicios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 10. PLANTILLAS DE RUTINA (biblioteca del trainer; sin FK viva a rutinas de alumno)
CREATE TABLE routine_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_routine_templates_trainer (trainer_id),
    CONSTRAINT fk_routine_templates_trainer
      FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. LÍNEAS DE EJERCICIO DE PLANTILLA (copia independiente al asignar)
-- exercise_id: vínculo opcional al catálogo (Feature 022); ON DELETE SET NULL.
CREATE TABLE template_exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    exercise_id INT NULL,
    series INT NOT NULL,
    repeticiones INT NOT NULL,
    peso DECIMAL(6,2) NOT NULL,
    rest_time_seconds INT NOT NULL DEFAULT 90
      COMMENT 'Descanso entre series (segundos); Feature 028',
    superset_letter VARCHAR(2) NULL
      COMMENT 'Grupo superserie/circuito (A, B) - Feature 029',
    indicaciones TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    INDEX idx_template_exercises_template (template_id),
    INDEX idx_template_exercises_exercise (exercise_id),
    CONSTRAINT fk_template_exercises_template
      FOREIGN KEY (template_id) REFERENCES routine_templates(id) ON DELETE CASCADE,
    CONSTRAINT fk_template_exercises_catalog_exercise
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 12. COMPOSICIÓN CORPORAL (historial antropométrico fechado; Feature 026)
-- bmi se calcula en el service (nunca confiar en el cliente).
CREATE TABLE body_composition_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    recorded_by INT NOT NULL,
    measured_at DATE NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    height_cm DECIMAL(5,2) NOT NULL,
    body_fat_pct DECIMAL(5,2) NULL,
    bmi DECIMAL(5,2) NULL,
    chest_cm DECIMAL(5,2) NULL,
    waist_cm DECIMAL(5,2) NULL,
    triceps_cm DECIMAL(5,2) NULL,
    biceps_cm DECIMAL(5,2) NULL,
    glutes_cm DECIMAL(5,2) NULL,
    quads_cm DECIMAL(5,2) NULL,
    calves_cm DECIMAL(5,2) NULL,
    back_cm DECIMAL(5,2) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bcl_client_measured (client_id, measured_at),
    CONSTRAINT fk_bcl_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_bcl_recorder
      FOREIGN KEY (recorded_by) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 13. NOTIFICACIONES IN-APP (Feature 025)
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type ENUM(
      'routine_assigned',
      'routine_completed',
      'system',
      'pr_achieved',
      'streak_milestone',
      'streak_at_risk'
    ) NOT NULL DEFAULT 'system',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_unread (user_id, is_read),
    CONSTRAINT fk_notifications_user
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. OBJETIVOS NUTRICIONALES (Feature 031)
CREATE TABLE nutrition_targets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    trainer_id INT NOT NULL,
    calories INT NOT NULL,
    protein_g INT NOT NULL,
    carbs_g INT NOT NULL,
    fats_g INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_nutrition_targets_client (client_id),
    INDEX idx_nutrition_targets_trainer (trainer_id),
    CONSTRAINT fk_nutrition_targets_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_nutrition_targets_trainer
      FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 15. HÁBITOS DIARIOS (Feature 032)
-- logged_date = fecha civil local del cliente (YYYY-MM-DD), sin UTC.
CREATE TABLE habits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    trainer_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_habits_client (client_id),
    INDEX idx_habits_trainer (trainer_id),
    CONSTRAINT fk_habits_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_habits_trainer
      FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE habit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    habit_id INT NOT NULL,
    logged_date DATE NOT NULL,
    UNIQUE KEY uq_habit_logs_habit_date (habit_id, logged_date),
    INDEX idx_habit_logs_date (logged_date),
    CONSTRAINT fk_habit_logs_habit
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 16. CHECK-IN SEMANAL Y FOTOS DE PROGRESO (Feature 033)
-- created_at / taken_at = fecha civil local (YYYY-MM-DD), sin UTC.
CREATE TABLE weekly_checkins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    created_at DATE NOT NULL,
    sleep_quality TINYINT NOT NULL,
    stress_level TINYINT NOT NULL,
    diet_adherence TINYINT NOT NULL,
    notes TEXT NULL,
    reviewed_at DATETIME NULL DEFAULT NULL,
    INDEX idx_weekly_checkins_client (client_id),
    INDEX idx_weekly_checkins_created (created_at),
    INDEX idx_weekly_checkins_reviewed (reviewed_at),
    CONSTRAINT fk_weekly_checkins_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_weekly_checkins_sleep
      CHECK (sleep_quality BETWEEN 1 AND 5),
    CONSTRAINT chk_weekly_checkins_stress
      CHECK (stress_level BETWEEN 1 AND 5),
    CONSTRAINT chk_weekly_checkins_diet
      CHECK (diet_adherence BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE progress_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    checkin_id INT NULL,
    image_url VARCHAR(512) NOT NULL,
    pose_type ENUM('front', 'side', 'back') NOT NULL,
    taken_at DATE NOT NULL,
    INDEX idx_progress_photos_client (client_id),
    INDEX idx_progress_photos_checkin (checkin_id),
    INDEX idx_progress_photos_pose (pose_type),
    CONSTRAINT fk_progress_photos_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_photos_checkin
      FOREIGN KEY (checkin_id) REFERENCES weekly_checkins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 17. MENSAJERÍA INTERNA (Feature 034 — chat SSE)
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_receiver (receiver_id),
    INDEX idx_messages_pair_created (sender_id, receiver_id, created_at),
    CONSTRAINT fk_messages_sender
      FOREIGN KEY (sender_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_receiver
      FOREIGN KEY (receiver_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 18. MEMBRESÍA / CONTROL DE PAGO DEL ALUMNO (Feature 040)
-- days_remaining se calcula en service (DATEDIFF), no es columna.
CREATE TABLE client_memberships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    status ENUM('active', 'owing', 'expired') NOT NULL DEFAULT 'active',
    period_start DATE NULL,
    period_end DATE NULL,
    notes TEXT NULL,
    block_on_unpaid BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_client_memberships_client (client_id),
    INDEX idx_client_memberships_status (status),
    INDEX idx_client_memberships_period_end (period_end),
    CONSTRAINT fk_client_memberships_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_client_memberships_updated_by
      FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 19. RÉCORDS PERSONALES / PRs (Feature 041)
CREATE TABLE personal_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    exercise_id INT NULL,
    exercise_name VARCHAR(150) NOT NULL,
    weight DECIMAL(6,2) NOT NULL,
    reps INT NOT NULL,
    achieved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id INT NULL,
    set_log_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_personal_records_client_name (client_id, exercise_name),
    INDEX idx_personal_records_client_exercise (client_id, exercise_id),
    INDEX idx_personal_records_achieved (client_id, achieved_at),
    CONSTRAINT fk_personal_records_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_personal_records_session
      FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE SET NULL,
    CONSTRAINT fk_personal_records_set_log
      FOREIGN KEY (set_log_id) REFERENCES workout_set_logs(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 20. RACHAS / CONSISTENCIA (Feature 042)
CREATE TABLE client_streaks (
    client_id INT NOT NULL,
    current_streak INT NOT NULL DEFAULT 0,
    best_streak INT NOT NULL DEFAULT 0,
    week_goal INT NOT NULL DEFAULT 3,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (client_id),
    CONSTRAINT fk_client_streaks_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 21. PLANES DE DIETA (Feature 043)
-- Totales del plan = suma de diet_items (recalculados en backend; no confiar en el cliente).
CREATE TABLE diet_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    client_id INT NULL,
    title VARCHAR(150) NOT NULL,
    notes TEXT NULL,
    calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
    protein_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
    carbs_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fats_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_diet_plans_trainer (trainer_id),
    INDEX idx_diet_plans_client (client_id),
    INDEX idx_diet_plans_client_active (client_id, is_active),
    CONSTRAINT fk_diet_plans_trainer
      FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_diet_plans_client
      FOREIGN KEY (client_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE diet_meals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    diet_plan_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    time_hint VARCHAR(20) NULL,
    INDEX idx_diet_meals_plan (diet_plan_id),
    CONSTRAINT fk_diet_meals_plan
      FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE diet_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    diet_meal_id INT NOT NULL,
    food_name VARCHAR(150) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL DEFAULT 'g',
    calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
    protein_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
    carbs_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fats_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    INDEX idx_diet_items_meal (diet_meal_id),
    CONSTRAINT fk_diet_items_meal
      FOREIGN KEY (diet_meal_id) REFERENCES diet_meals(id) ON DELETE CASCADE
) ENGINE=InnoDB;
