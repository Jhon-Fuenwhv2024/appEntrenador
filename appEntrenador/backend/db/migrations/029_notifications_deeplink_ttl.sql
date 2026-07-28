-- Feature 074: deep-links, TTL y tipo diet_updated en notifications
-- Nota: columnas en ALTERs separados (compat TiDB / MySQL)

ALTER TABLE notifications
  ADD COLUMN entity_type VARCHAR(50) NULL AFTER type;

ALTER TABLE notifications
  ADD COLUMN entity_id INT NULL AFTER entity_type;

ALTER TABLE notifications
  ADD COLUMN action_url VARCHAR(255) NULL AFTER entity_id;

ALTER TABLE notifications
  ADD COLUMN expires_at TIMESTAMP NULL AFTER created_at;

ALTER TABLE notifications
  MODIFY COLUMN type ENUM(
    'routine_assigned',
    'routine_completed',
    'system',
    'pr_achieved',
    'streak_milestone',
    'streak_at_risk',
    'diet_updated'
  ) NOT NULL DEFAULT 'system';

UPDATE notifications
SET expires_at = DATE_ADD(created_at, INTERVAL 30 DAY)
WHERE expires_at IS NULL;

CREATE INDEX idx_notifications_expires ON notifications (user_id, expires_at);
CREATE INDEX idx_notifications_read_created ON notifications (user_id, is_read, created_at);
