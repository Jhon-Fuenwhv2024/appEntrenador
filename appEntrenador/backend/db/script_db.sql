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

-- 3. TABLA DE INFORMACIÓN EXTRA DEL ALUMNO
CREATE TABLE alumnos_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo ENUM('Masculino', 'Femenino', 'Otro') NOT NULL,
    lesiones TEXT,
    objetivo VARCHAR(100) NOT NULL,
    foto_url VARCHAR(255) DEFAULT 'default_avatar.png',
    ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
