-- HITL: marcar si el ejercicio sirve como calentamiento (según musculatura etiquetada)
ALTER TABLE exercises
  ADD COLUMN is_warmup TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '1 = usable como calentamiento para el músculo etiquetado'
    AFTER secondary_muscles;
