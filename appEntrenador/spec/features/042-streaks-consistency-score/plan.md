# 042 · Plan — Rachas y Score de Consistencia

## Enfoque

1. DDL `client_streaks` + migración + ensure + `script_db.sql`.
2. Módulo `backend/src/modules/consistency/` (o `streaks/`): cálculo de racha (días consecutivos con ≥1 sesión finished), workouts esta semana ISO, score.
3. Endpoints GET me/client + PUT week_goal (trainer).
4. Hook opcional post-finish session para actualizar `current_streak` / `best_streak`.
5. FE: `ConsistencyRing.vue` (o similar) en dashboard cliente; campos en header 360; editor meta en panel trainer.
6. Notificaciones milestone/at_risk reutilizando `notifications`.
7. Docs: fórmula de score en `docs/data-flows.md` o ADR corto si hace falta.

## Fórmula score (MVP propuesta)

```
workouts_this_week / week_goal * 70  +  min(current_streak, 10) * 3
```
Cap a 100. Ajustable en implementación si el UX lo pide; documentar el valor final.

## Archivos clave

- BE: `modules/consistency/*`, hook en `workout-sessions`
- FE client: widget en `ClientDashboardView` / progreso
- FE trainer: `Client360Header` / panel meta
- Docs API / schema / data-flows
