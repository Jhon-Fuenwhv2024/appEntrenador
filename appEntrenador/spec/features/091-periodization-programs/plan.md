# 091 · Plan de implementación

## Enfoque

Strangler minimalista (auditoría Fase 3):

1. Nueva capa `training_programs` → phases → weeks → days → exercises.
2. `client_program_assignments` ancla fechas + modo de progresión.
3. Materialización lazy de la semana activa a `rutinas`/`ejercicios` (compat Player).
4. Last lifts desde `workout_set_logs` (mismo match por nombre que Feature 019).

## Modelo de datos

Ver migración `035_training_programs.sql` y `ensureTrainingProgramsTables.js`.

## API (trainer)

| Método | Path | Acción |
|--------|------|--------|
| GET | `/api/programs` | Listar programas del trainer |
| POST | `/api/programs` | Crear macrociclo |
| GET | `/api/programs/:id` | Detalle anidado |
| PATCH | `/api/programs/:id` | Actualizar meta |
| DELETE | `/api/programs/:id` | Borrar programa |
| GET | `/api/programs/presets` | Presets de mesociclo |
| POST | `/api/programs/:id/phases` | Añadir fase (preset + seed templates) |
| POST | `/api/programs/:id/phases/:phaseId/propagate` | Semana 1 → resto |
| PUT | `/api/programs/:id/weeks/:weekId/days` | Upsert días de un microciclo |
| POST | `/api/programs/:id/assign` | Asignar a alumno + materializar S1 |
| GET | `/api/clients/:clientId/program-assignments` | Asignaciones del alumno |
| POST | `/api/program-assignments/:id/advance-week` | Rematerializar siguiente microciclo |
| GET | `/api/clients/:clientId/last-lifts` | Últimos pesos/reps por ejercicio |

## UI

- Tab **Programas** en `LibraryView`.
- Panel listado + wizard rápido (macro + fase preset + días desde plantillas).
- Diálogo asignar: alumno, fase opcional, `progression_mode`, incremento kg.
- En Client 360 Programación: card de asignación activa + avanzar semana.

## Seguridad

- `authenticate` + `requireRole('trainer')`.
- Ownership: `program.trainer_id = req.user.id`; cliente vía `getClientOwnedByTrainer`.
