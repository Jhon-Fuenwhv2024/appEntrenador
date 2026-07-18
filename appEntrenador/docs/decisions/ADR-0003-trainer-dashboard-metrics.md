# ADR-0003 · Definiciones de métricas del dashboard trainer

## Estado

Aceptado (Feature 035).

## Contexto

El Inicio del entrenador necesita KPIs gerenciales (retención, cola de tareas, progreso semanal) con reglas de negocio estables y consultas set-based.

## Decisión

### Alumno activo / inactivo (retención)

- **Ventana:** últimos **14 días** (`windowDays: 14`).
- **Activo:** cliente del trainer (`usuarios.rol = 'client'` y `trainer_id = req.user.id`) con ≥1 `workout_sessions` en status `completed` cuyo `finished_at` cae en esa ventana.
- **Inactivo:** resto de clientes del trainer (total − activos).
- **Tasa de retención:** `round(activos / total * 100)`; si `total = 0` → `0`.
- No se usa membresía (040) como criterio en MVP; se puede revisar en una iteración posterior.

### Check-in sin revisar

- Fuente: `weekly_checkins` de alumnos del trainer.
- **Sin revisar:** `reviewed_at IS NULL`.
- Columna `reviewed_at` (DATETIME nullable) añadida en Feature 035. Marcar revisión (UI/API) puede llegar después; el KPI solo cuenta pendientes.

### Dieta por asignar

- Feature 043: alumno del trainer **sin** fila en `diet_plans` con `is_active = 1`.
- (`nutrition_targets` sigue siendo el objetivo diario de macros 031; no sustituye el plan de comidas.)

### Progreso de la semana

- **Semana local:** lunes 00:00 → domingo (MySQL `WEEKDAY`: 0 = lunes).
- `sessionsCompleted`: sesiones `completed` de alumnos del trainer con `finished_at` en la semana actual.
- `previousWeekSessions`: mismo criterio en la semana anterior (lunes–domingo previos).
- `vsPreviousPercent`: variación porcentual vs semana anterior (`0` si ambas son 0; `100` si anterior es 0 y actual > 0).
- `byDay`: serie de 7 días (`date` YYYY-MM-DD + `count`), incluyendo ceros.

## Consecuencias

- `GET /api/trainer/dashboard` mantiene campos 015 y añade `retention`, `pendingTasks`, `weekProgress`.
- Agregados en pocas queries SQL (sin N+1 por cliente).
