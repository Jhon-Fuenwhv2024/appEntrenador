# 087 · Plan técnico

## Component map (FE)

| Pieza | Responsabilidad |
|-------|-----------------|
| `useWorkoutSession.postponeExercise` | Marcar ejercicio, `splice` + insertar en `fromIndex+1` (tras el siguiente), mantener índice → siguiente inmediato |
| `WorkoutPlayerView` | CTA «Máquina ocupada» + snackbar; cablear `postponeExercise` |
| `WorkoutRestRing` | Up next tappable → emit `preview` (el “RestTimer” del brief) |
| `NextExerciseTechSheetDialog` | `v-dialog` ficha técnica; media solo mientras abierto (`v-if`) |
| `WorkoutExerciseMedia` | Reuso: video muted autoplay loop |

## Flujo Posponer

```mermaid
sequenceDiagram
  participant UI as Player working
  participant S as useWorkoutSession
  UI->>S: postponeExercise(id)
  S->>S: mark postponed, insert after next in ejercicios[]
  S->>S: setIndex = first incomplete of new current
  S-->>UI: snackbar + next exercise UI
```

## Flujo Ficha en descanso

```mermaid
sequenceDiagram
  participant Rest as WorkoutRestRing
  participant Dialog as TechSheetDialog
  participant Timer as useTimer
  Note over Timer: wall-clock sigue corriendo
  Rest->>Dialog: open with nextPreview
  Dialog->>Dialog: mount media (v-if)
  Dialog->>Dialog: close → unmount media
```

## Decisiones

- Mutación inmutable del array (`[...list]` + reassign `routine`) para reactividad con `shallowRef(routine)`.
- Identidad por `ejercicios.id`; fallback índice actual.
- Modal no usa `persistent` forzado; el timer no depende del DOM.
- Musculatura: enriquecer SELECT de catálogo (`target_muscle`, `target_muscle_es`, `primary_muscle`); UI usa `displayExerciseMuscle` + fallback “Sin etiquetar”.
