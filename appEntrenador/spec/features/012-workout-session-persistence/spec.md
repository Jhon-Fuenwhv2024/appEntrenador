# 012 · Persistencia de sesión y visibilidad trainer

**Estado:** implementada

## Qué hace

Guarda el log de entrenamiento (peso, reps, fecha) y permite al trainer ver el historial en la ficha del cliente.

## Criterios de aceptación

- [x] Tablas `workout_sessions` + `workout_set_logs`
- [x] `POST /me/workout-sessions` (client, ownership por `req.user.id`)
- [x] `GET /clients/:clientId/workout-sessions` (trainer + ownership)
- [x] Player guarda al finalizar
- [x] Historial en `ClientRoutinesView`
- [x] Docs API / schema / data-flows actualizados
