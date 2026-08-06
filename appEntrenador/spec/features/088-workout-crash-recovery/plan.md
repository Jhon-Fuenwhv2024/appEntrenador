# 088 · Plan técnico

## Component map

| Pieza | Responsabilidad |
|-------|-----------------|
| `offlineDb.js` | DB `trainfit-offline` v2 compartida |
| `activeWorkoutDraft.js` | get/put/clear draft por `clientId` |
| `useWorkoutSession` | `restore()`, autosave debounce, clear en reset |
| `useTimer` | `resumeAt(targetEndMs)` sin beep si ya expiró (caller avanza) |
| `useActiveWorkoutRecovery` | Detectar draft + acciones resume/discard |
| `WorkoutRecoveryDialog` | Modal Reanudar / Descartar |
| `ClientDashboardView` | Recovery al entrar al home |
| `WorkoutPlayerView` | Hydrate, Cancelar, clear tras persist |

## Persistencia

- IndexedDB store `active_workout_draft`, `keyPath: clientId`.
- Flush en `visibilitychange: hidden` / `pagehide`.
- Clear al finish (API o enqueue) y al cancelar/descartar.

## Hidratación rest

- Guardar `restEndsAt` ISO.
- Si futuro → `resumeAt(endMs)`.
- Si pasado → `advanceAfterRest()` sin `fireComplete`/beep.
