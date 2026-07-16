# 041 · Récords Personales (PRs) y Celebraciones

**Estado:** pendiente
**Depende de:** 012 (Persistencia sesión), 011 (Workout Player), 021 (Progreso)
**Supersede / absorbe:** **030** (PRs y celebraciones — spec antigua sin implementación)
**Consume en UI:** 038 (Player), 039 (chip en Ficha 360)

## Qué hace

Detecta automáticamente cuando un alumno supera su máximo histórico de peso (o peso×reps) en un ejercicio al cerrar una sesión, persiste el PR y muestra una celebración en el Workout Player. Expone listados para cliente y trainer.

## Criterios de aceptación

### Base de datos

- [ ] Tabla `personal_records`:
  - `id`, `client_id` FK, `exercise_id` nullable (catálogo), `exercise_name`
  - `weight`, `reps`, `achieved_at`, `session_id`, `set_log_id` nullable
  - Índices por (`client_id`, `exercise_name`) o (`client_id`, `exercise_id`)

### Backend

- [ ] Módulo `backend/src/modules/personal-records/` (Route → Controller → Service).
- [ ] Detección al finalizar sesión en `workout-sessions` (comparar sets de la sesión vs máximos previos en `workout_set_logs` / `personal_records`).
- [ ] `GET /me/personal-records` — client.
- [ ] `GET /clients/:clientId/personal-records` — trainer dueño.
- [ ] Notificación `pr_achieved` al cliente (y opcionalmente al trainer) vía módulo `notifications`.

### UI

- [ ] Overlay/celebración en `WorkoutPlayerView` al recibir PRs en la respuesta de cierre de sesión.
- [ ] Sección “Mis récords” en `ClientProgressView`.
- [ ] Chip/widget “PRs este mes” en Ficha 360 (039) cuando esté disponible.

## Regla de detección (MVP)

- PR de **peso**: mismo ejercicio (por `exercise_id` si existe, si no por `exercise_name` normalizado) y `weight` estrictamente mayor al máximo histórico previo.
- Opcional fase 2: PR de reps al mismo peso, o e1RM estimado — fuera del MVP si complica.

## Fuera de alcance

- Leaderboards sociales entre alumnos.
- Badges/XP genéricos (solo PRs).
- Edición manual de PRs por el trainer (solo lectura + detección automática).
