# 019 · Plan

## Enfoque

1. Service: consulta último set (o última sesión) por `client_id` + match de ejercicio (`exercise_id` de línea si existe, o `exercise_name` normalizado).
2. Exponer en `GET /me/routines` enriquecido y/o `GET /me/exercises/:key/last-performance`; trainer: endpoint bajo `/clients/:id/...`.
3. Frontend Player: mostrar hint de último peso/reps; prefill opcional del input (decisión UX en implementación).
4. Docs + tasks.

## Nota

Hasta 022 el match puede ser por nombre; documentar limitación y migrar a id estable cuando exista vínculo catálogo.
