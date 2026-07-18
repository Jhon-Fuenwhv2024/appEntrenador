-- Feature 035: cola de check-ins sin revisar en dashboard trainer
ALTER TABLE weekly_checkins
  ADD COLUMN reviewed_at DATETIME NULL DEFAULT NULL AFTER notes,
  ADD INDEX idx_weekly_checkins_reviewed (reviewed_at);
