# 041 · Plan — PRs y Celebraciones

## Enfoque

1. DDL `personal_records` + migración + ensure boot + `script_db.sql`.
2. Service de detección: tras insertar set logs / al marcar sesión finished, calcular nuevos PRs e insertar filas.
3. Ampliar respuesta de cierre de sesión con `new_prs: []` para que el Player celebre sin round-trip extra.
4. Endpoints de listado + notificación `pr_achieved`.
5. FE: componente `PrCelebrationOverlay.vue`; sección en progreso; chip en 360.
6. Nota en spec **030**: absorbida por 041.
7. Docs API / schema.

## Archivos clave

- BE: `modules/personal-records/*`, integración en `modules/workout-sessions/`
- FE: `WorkoutPlayerView.vue`, `useWorkoutSession.js`, `ClientProgressView.vue`, ficha 360
- Notificaciones: `modules/notifications`

## Criterio de igualdad de ejercicio

Preferir `exercise_id` cuando la línea de rutina/log lo tenga; fallback `LOWER(TRIM(exercise_name))`.
