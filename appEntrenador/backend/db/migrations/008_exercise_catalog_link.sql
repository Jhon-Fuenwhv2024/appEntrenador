-- Feature 022: vínculo estable catálogo ↔ líneas de rutina/plantilla
-- exercise_id nullable + ON DELETE SET NULL (inmutabilidad del historial)

ALTER TABLE ejercicios
  ADD COLUMN exercise_id INT NULL AFTER nombre,
  ADD INDEX idx_ejercicios_exercise (exercise_id),
  ADD CONSTRAINT fk_ejercicios_catalog_exercise
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL;

ALTER TABLE template_exercises
  ADD COLUMN exercise_id INT NULL AFTER nombre,
  ADD INDEX idx_template_exercises_exercise (exercise_id),
  ADD CONSTRAINT fk_template_exercises_catalog_exercise
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL;
