-- 1. Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS coach_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. TABLA DE USUARIOS (Estructura principal para el Login)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Almacenará texto plano temporalmente, luego hash
    nombre VARCHAR(100) NOT NULL,
    rol ENUM('trainer', 'client') NOT NULL DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. TABLA DE INFORMACIÓN EXTRA DEL ALUMNO
CREATE TABLE alumnos_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE NOT NULL,              -- Para calcular la edad exacta automáticamente
    sexo ENUM('Masculino', 'Femenino', 'Otro') NOT NULL,
    lesiones TEXT,                               -- TEXT permite escribir párrafos largos de historial médico
    objetivo VARCHAR(100) NOT NULL,
    foto_url VARCHAR(255) DEFAULT 'default_avatar.png', -- Ruta de la imagen guardada en el servidor
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
-- Creamos la tabla con tipos de datos numéricos puros
CREATE TABLE ejercicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rutina_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    series INT NOT NULL,                  -- Ahora es un entero (Ej: 4)
    repeticiones INT NOT NULL,            -- Ahora es un entero (Ej: 10)
    indicaciones TEXT,
    peso DECIMAL(6,2) NOT NULL,           -- DECIMAL permite cálculos exactos y números como 62.50
    FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE
) ENGINE=InnoDB;