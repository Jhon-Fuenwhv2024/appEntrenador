# 011 · UI Workout Player

**Estado:** implementada

## Qué hace

Interfaz mobile-first del modo ejecución al pulsar **Comenzar**. Muestra media (GIF/video/imagen), serie actual, inputs de peso/reps y pantalla de descanso. UX: una acción a la vez, CTA claro, sin sobrecarga.

## Criterios de aceptación

- [x] Botón Comenzar en dashboard cliente
- [x] Ruta `/client/workout/:routineId` (rol client)
- [x] Media del ejercicio actual + fallback amable
- [x] Inputs peso/reps prellenados; CTA Completar serie
- [x] Pantalla de descanso con countdown
- [x] Auto-avance visual al siguiente ejercicio
- [x] `GET /me/routines` enriquecido con `media_type` / `media_url`
