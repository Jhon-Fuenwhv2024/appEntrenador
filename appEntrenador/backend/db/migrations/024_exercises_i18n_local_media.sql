-- Feature 044: i18n ES + ruta de media hosteada localmente
ALTER TABLE exercises
  ADD COLUMN name_es VARCHAR(150) NULL
    COMMENT 'Nombre en español (scraping Fitcron)'
    AFTER name;

ALTER TABLE exercises
  ADD COLUMN description_es TEXT NULL
    COMMENT 'Descripción en español (scraping Fitcron)'
    AFTER description;

ALTER TABLE exercises
  ADD COLUMN local_media_path VARCHAR(500) NULL
    COMMENT 'Ruta relativa local, ej. /uploads/exercises/exercise_12.gif'
    AFTER media_url;

ALTER TABLE exercises
  ADD COLUMN target_muscle_es VARCHAR(100) NULL
    COMMENT 'Grupo muscular en español (opcional)'
    AFTER target_muscle;
