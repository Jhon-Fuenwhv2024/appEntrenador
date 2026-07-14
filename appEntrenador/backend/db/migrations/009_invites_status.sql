-- Feature 023: invitaciones.status (pending|used|revoked) reemplaza usado BOOLEAN

ALTER TABLE invitaciones
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'
    COMMENT 'pending|used|revoked' AFTER token;

UPDATE invitaciones SET status = 'used' WHERE usado = TRUE;
UPDATE invitaciones SET status = 'pending' WHERE usado = FALSE;

ALTER TABLE invitaciones DROP COLUMN usado;
