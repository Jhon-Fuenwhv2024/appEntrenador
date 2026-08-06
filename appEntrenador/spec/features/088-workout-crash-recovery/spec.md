# 088 · Recuperación de entrenamiento ante cierres inesperados

**Estado:** implementado  
**Depende de:** 010/011/012 (player + sesión), 086 (IndexedDB offline), 087 (postpone reorder)  
**Skills:** `vue-best-practices`

## Qué hace

Si el alumno cierra la PWA, recarga o el SO mata el proceso a mitad de un entrenamiento, al volver puede **reanudar** exactamente donde lo dejó (ejercicio, serie, logs y descanso wall-clock) o **descartar** el draft local.

## Problema

- `useWorkoutSession` vive solo en memoria: al desmontar/recargar se pierde el progreso.
- Feature 086 solo encola sesiones **ya terminadas** sin red; no cubre series a medias.

## Criterios de aceptación

- [x] Autosave a IndexedDB (`active_workout_draft`) en cada cambio clave (serie, índice, fase, logs, rest target).
- [x] Draft incluye: `routineId`, índices, `logs`, `startedAt`, snapshot de rutina (incl. postpone), `restEndsAt` si resting.
- [x] Al abrir Home cliente o Player: si hay draft huérfano → modal «Tienes un entrenamiento en curso» con **Reanudar** / **Descartar**.
- [x] Reanudar hidrata el player sin «Comenzar» de nuevo; timers sin beep fantasma ni doble tick.
- [x] Al completar (API OK o cola offline 086) se borra el draft.
- [x] Botón «Cancelar entrenamiento» + confirmación limpia draft y sale.

## Fuera de alcance

- Pinia / VueUse / nuevas dependencias npm.
- Cambios MySQL o API.
- Multi-draft / historial de abandonos.
- Background Sync API.
