-- Feature 028: descanso configurable por ejercicio (segundos entre series)
ALTER TABLE ejercicios
  ADD COLUMN rest_time_seconds INT NOT NULL DEFAULT 90
    COMMENT 'Descanso entre series (segundos)'
    AFTER peso;

ALTER TABLE template_exercises
  ADD COLUMN rest_time_seconds INT NOT NULL DEFAULT 90
    COMMENT 'Descanso entre series (segundos)'
    AFTER peso;
