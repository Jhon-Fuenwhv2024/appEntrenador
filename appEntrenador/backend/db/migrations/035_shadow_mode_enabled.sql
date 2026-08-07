-- Feature 076: opt-in modo sombra (preferencia cliente)
ALTER TABLE client_notification_settings
  ADD COLUMN shadow_mode_enabled BOOLEAN NOT NULL DEFAULT TRUE
  AFTER timezone;
