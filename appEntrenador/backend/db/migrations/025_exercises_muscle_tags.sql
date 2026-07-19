-- HITL: etiquetado de músculo principal / secundarios en catálogo
ALTER TABLE exercises
  ADD COLUMN primary_muscle VARCHAR(100) NULL
    COMMENT 'Músculo principal (taxonomía HITL)'
    AFTER target_muscle_es;

ALTER TABLE exercises
  ADD COLUMN secondary_muscles JSON NULL
    COMMENT 'Músculos secundarios (array JSON de strings)'
    AFTER primary_muscle;
