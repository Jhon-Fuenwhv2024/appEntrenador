# 010 · Motor de ejecución de rutina

**Estado:** implementada

## Qué hace

Composable Composition API que orquesta una sesión activa: ejercicio actual, serie actual, descanso entre series y auto-avance al siguiente ejercicio. Los logs de peso/reps viven en memoria hasta FEAT-012.

## Criterios de aceptación

- [x] `useWorkoutSession` con fases `working` | `resting` | `finished`
- [x] Índice de ejercicio y de serie reactivos
- [x] Timer de descanso (default 90s) con cleanup
- [x] `completeSet` registra peso/reps y avanza (rest → misma serie+1, o siguiente ejercicio, o finished)
- [x] Defaults de peso/reps = valores prescritos del ejercicio
