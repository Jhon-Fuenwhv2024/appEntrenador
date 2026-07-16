-- Feature 036 / 037 Fase 1: SuperAdmin + planes SaaS B2B
ALTER TABLE usuarios
  ADD COLUMN is_superadmin BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE trainers_info
  ADD COLUMN saas_plan ENUM('FREE', 'PRO') NOT NULL DEFAULT 'FREE',
  ADD COLUMN saas_expiration_date DATE NULL;
