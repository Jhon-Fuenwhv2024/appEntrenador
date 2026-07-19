# Tasks — 046 Exercise muscle tagger

## Backend / DB

- [x] Migración `025_exercises_muscle_tags.sql` + `script_db.sql`
- [x] Script one-shot + `ensureExercisesMuscleTags` al arrancar
- [x] Módulo `admin-exercises` (routes → controller → service)
- [x] `GET /api/admin/exercises/untagged` (LIMIT 1, superadmin)
- [x] `PATCH /api/admin/exercises/:id/tag` (JSON secondary, 200)
- [x] Columna `is_warmup` + UI Sí/No (según musculatura elegida)
- [x] Barra de progreso (% / etiquetados / faltantes) vía `meta` del GET untagged

## Frontend

- [x] API client + composable `useExerciseTagger`
- [x] `ExerciseTaggerView` + media + controles
- [x] Ruta `/admin/exercises/tagger` (requiresSuperAdmin)
- [x] Enlace desde AppShell / Panel SaaS

## Docs

- [x] `docs/api.md`, `docs/database-schema.md`, `docs/exercise-muscle-tagger.md`
