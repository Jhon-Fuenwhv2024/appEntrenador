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
CREATE TABLE ejercicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rutina_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    series INT NOT NULL,
    repeticiones INT NOT NULL,
    indicaciones TEXT,
    peso DECIMAL(6,2) NOT NULL,
    FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. TABLA DE INVITACIONES PARA REGISTRO
CREATE TABLE invitaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
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
    description TEXT NULL,
    target_muscle VARCHAR(100) NOT NULL,
    media_type ENUM('image', 'gif', 'youtube', 'video', 'none') NOT NULL DEFAULT 'none',
    media_url VARCHAR(500) NULL,
    created_by_trainer_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_exercises_name (name),
    INDEX idx_exercises_trainer (created_by_trainer_id),
    CONSTRAINT fk_exercises_trainer
      FOREIGN KEY (created_by_trainer_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

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
CREATE TABLE template_exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    series INT NOT NULL,
    repeticiones INT NOT NULL,
    peso DECIMAL(6,2) NOT NULL,
    indicaciones TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    INDEX idx_template_exercises_template (template_id),
    CONSTRAINT fk_template_exercises_template
      FOREIGN KEY (template_id) REFERENCES routine_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB;
