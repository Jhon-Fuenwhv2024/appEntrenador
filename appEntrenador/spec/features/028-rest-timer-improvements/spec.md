# 028 · Mejoras al Temporizador de Descanso

## Objetivo
En la vista de ejecución de rutina (Workout Player), añadir alerta sonora/vibración al finalizar el temporizador de descanso. El tiempo de descanso debe ser configurable por el entrenador al momento de crear/editar la rutina.

## Requisitos
- Modificar tabla `routine_exercises` para incluir `rest_time_seconds`.
- Formulario de rutinas del entrenador: campo para tiempo de descanso.
- Workout Player: Alerta sonora al terminar el tiempo.