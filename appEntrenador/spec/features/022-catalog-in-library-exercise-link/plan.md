# 022 · Plan

## Enfoque

1. UX: `/trainer/library` con tabs o subrutas (`/trainer/library/templates`, `/trainer/library/exercises`); reutilizar `ExercisesCatalogView`.
2. DDL: `exercise_id INT NULL` + FK en `ejercicios` (y líneas de plantilla si 018 ya existe).
3. Backend: aceptar/devolver `exercise_id` en create/update; validar que el exercise es global o del trainer.
4. Frontend combobox: al elegir del catálogo, persistir id + name.
5. Player/media: preferir id; docs de limitación del match por nombre pre-migración.

## Orden relativo a 018

Si 018 aún no está: se puede hacer solo la parte de `ejercicios` + reubicación UX; plantillas heredan el patrón al crearse.
