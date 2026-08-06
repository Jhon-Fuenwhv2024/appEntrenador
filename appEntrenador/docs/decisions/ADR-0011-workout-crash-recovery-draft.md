# ADR-0011 · Draft local de entrenamiento en curso (crash recovery)

**Estado:** aceptada  
**Feature:** [088-workout-crash-recovery](../../spec/features/088-workout-crash-recovery/spec.md)  
**Relacionados:** [ADR-0009](ADR-0009-background-resilience.md) (cola offline de cierre), [ADR-0002 rest](ADR-0002-rest-timer-background.md)

## Contexto

El player mantiene la sesión en un composable en memoria. Un cierre inesperado pierde series. La cola IndexedDB de 086 solo aplica a sesiones **completadas** sin red.

## Decisión

1. Persistir un **draft** de sesión activa en IndexedDB (`trainfit-offline` / `active_workout_draft`, keyed por `clientId`).
2. Autosave desde `useWorkoutSession` (debounce + flush al ocultar la página).
3. UI de recuperación (modal) en Home y Player: Reanudar / Descartar.
4. Borrar el draft al completar (API o enqueue 086), al cancelar o al descartar.
5. Rest: persistir `restEndsAt` wall-clock; al hidratar no disparar beep si el descanso ya venció.

## Consecuencias

- Un solo draft por cliente en el dispositivo.
- El snapshot de rutina puede ser grande (GIF URLs, etc.); sigue siendo razonable frente a límite IndexedDB.
- Sin cambios de API/MySQL.

## Alternativas rechazadas

- `pinia-plugin-persistedstate` / Pinia — el proyecto no usa Pinia para el player.
- VueUse `useLocalStorage` — nueva dependencia; payload + patrón IDB ya existe (086).
- localStorage sync — suficiente para prefs, peor para snapshots y writes frecuentes.
