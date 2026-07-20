-- Feature 056: email + password reset tokens on usuarios
ALTER TABLE usuarios
  ADD COLUMN email VARCHAR(255) NULL UNIQUE
    COMMENT 'Correo para recuperación de contraseña (Feature 056)',
  ADD COLUMN reset_password_token VARCHAR(64) NULL
    COMMENT 'SHA-256 hex del token de reset (Feature 056)',
  ADD COLUMN reset_password_expires DATETIME NULL
    COMMENT 'Expiración del token de reset (Feature 056)';
