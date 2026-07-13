# 008 · Catálogo de ejercicios (híbrido)

**Estado:** implementada (schema aplicado + seed ejecutado; sin API/UI)

## Qué hace

Añade la tabla catálogo `exercises` (distinta de `ejercicios`, líneas de rutina) para ejercicios globales del sistema y ejercicios privados por trainer. Incluye script de seed desde JSON local.

## Criterios de aceptación

- [x] Tabla `exercises` documentada en `backend/db/script_db.sql` con columnas híbridas y FK opcional a `usuarios`
- [x] Script `backend/scripts/seedExercises.js` inserta globales con prepared statements desde JSON local
- [x] Dataset local `backend/scripts/exercises_dataset.json` (~15–30 filas)
- [x] `docs/database-schema.md` describe el esquema y la distinción `exercises` vs `ejercicios`
- [x] Sin ejecutar el CREATE en MySQL hasta review del usuario (aplicado tras OK)
- [x] Sin API/UI ni FK desde `ejercicios` en esta feature
