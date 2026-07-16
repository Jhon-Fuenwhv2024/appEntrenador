-- Feature 037 Fase 1: SuperAdmin + planes SaaS B2B
-- Ejecutar en la base coach_db (phpMyAdmin → SQL) si npm run db:add-saas-plans falla.
-- Si alguna columna ya existe, MySQL dirá "Duplicate column name": ignórala y sigue con la siguiente.

ALTER TABLE usuarios
  ADD COLUMN is_superadmin BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE trainers_info
  ADD COLUMN saas_plan ENUM('FREE', 'PRO') NOT NULL DEFAULT 'FREE';

ALTER TABLE trainers_info
  ADD COLUMN saas_expiration_date DATE NULL;
