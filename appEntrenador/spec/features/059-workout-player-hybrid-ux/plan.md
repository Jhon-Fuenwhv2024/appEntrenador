# Plan · 059 Workout Player híbrido

## Component map

| Pieza | Responsabilidad |
|-------|-----------------|
| `WorkoutPlayerView.vue` | Orquestación: fases, persistencia, layout |
| `WorkoutSetsChecklist.vue` | Tabla de series del ejercicio actual (props in) |
| `WorkoutRestRing.vue` | Anillo SVG + reloj + controles ±15 / Skip |
| `useWorkoutSession.js` | `setsChecklist`, `nextExercisePreview`, `adjustRest`, `sessionElapsedFormatted` |
| `useTimer.js` | `adjust(deltaSeconds)` sobre `targetEndTime` |

## Pasos

1. SDD (`spec.md` / `plan.md` / `tasks.md`).
2. Extender `useTimer.adjust` (wall-clock).
3. Extender `useWorkoutSession` (checklist, preview, elapsed, adjustRest).
4. Componentes UI checklist + rest ring.
5. Cablear `WorkoutPlayerView` (working + resting).
6. Actualizar `docs/data-flows.md` + build.
