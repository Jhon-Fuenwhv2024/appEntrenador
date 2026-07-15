-- Feature 029: letra de grupo superserie/circuito (nullable)
ALTER TABLE ejercicios
  ADD COLUMN superset_letter VARCHAR(2) NULL
    COMMENT 'Grupo superserie/circuito (A, B) - Feature 029'
    AFTER rest_time_seconds;

ALTER TABLE template_exercises
  ADD COLUMN superset_letter VARCHAR(2) NULL
    COMMENT 'Grupo superserie/circuito (A, B) - Feature 029'
    AFTER rest_time_seconds;
