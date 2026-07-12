-- FEAT-004: ownership trainer ↔ cliente
-- Ejecutar una vez sobre coach_db existente (XAMPP / MySQL).

USE coach_db;

-- Vincula cada invitación al trainer que la creó
ALTER TABLE invitaciones
  ADD COLUMN trainer_id INT NULL AFTER usado;

ALTER TABLE invitaciones
  ADD CONSTRAINT fk_invitaciones_trainer
  FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- Cliente pertenece a un trainer (NULL en filas trainer)
ALTER TABLE usuarios
  ADD COLUMN trainer_id INT NULL AFTER rol;

ALTER TABLE usuarios
  ADD CONSTRAINT fk_usuarios_trainer
  FOREIGN KEY (trainer_id) REFERENCES usuarios(id) ON DELETE SET NULL;
