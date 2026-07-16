# 042 · Rachas Semanales y Score de Consistencia

**Estado:** pendiente
**Depende de:** 012 (Sesiones), 032 (Hábitos — opcional para score), 038 (widget Inicio), 039 (header 360)
**Relacionada:** 041 (PRs = picos; esta feature = hábito continuo)

## Qué hace

Calcula y muestra la **racha** de días/entrenos del alumno y un **score de consistencia** (0–100) con meta semanal configurable por el entrenador. Alimenta el Modo Cliente (anillo/llama) y la Ficha 360 del trainer.

## Criterios de aceptación

### Datos / persistencia

- [ ] Tabla `client_streaks` (recomendado):
  - `client_id` UNIQUE FK
  - `current_streak` INT
  - `best_streak` INT
  - `week_goal` INT default 3 (entrenos/semana)
  - `updated_at`
- [ ] Alternativa aceptable en MVP: cálculo 100% on-the-fly sin tabla, persistiendo solo `week_goal` (columna en `alumnos_info` o tabla mínima).
- [ ] Fuente de verdad de “día con entreno”: `workout_sessions` con status finished (fecha local/UTC documentada).
- [ ] Score 0–100: fórmula documentada (ej. % de meta semanal últimos 7 días + bonus de racha, cap 100).

### Backend

- [ ] `GET /me/consistency` — client: `{ current_streak, best_streak, week_goal, workouts_this_week, score, days_remaining_in_week? }`.
- [ ] `GET /clients/:clientId/consistency` — trainer dueño.
- [ ] `PUT /clients/:clientId/consistency` o `PUT .../week-goal` — trainer actualiza `week_goal`.
- [ ] Recalcular racha al cerrar sesión (hook en workout-sessions) o lazy en GET.
- [ ] Notificaciones opcionales: `streak_milestone` (ej. 7 días), `streak_at_risk` (sin entreno y racha > 0).

### UI Cliente

- [ ] Widget en Inicio (038): “Racha: N días” + progreso meta semanal “X/Y entrenos”.
- [ ] Micro-celebración al proteger/alargar racha (puede reutilizar patrón visual de 041, sin confeti de PR).
- [ ] En Progreso: mejor racha histórica.

### UI Entrenador

- [ ] Score + racha en cabecera Ficha 360 (039).
- [ ] Control para editar meta semanal (`week_goal`).

## Fuera de alcance

- Leaderboards entre alumnos del mismo trainer.
- Rachas de hábitos diarios como métrica principal (pueden ponderar el score en fase 2).
- Push notifications nativas / email.
