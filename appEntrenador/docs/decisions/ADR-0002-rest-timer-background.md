# ADR-0002 — Temporizador de descanso resistente a background throttling

## Estado

Aceptado (Feature 028, frontend)

## Contexto

En iOS/Android Safari/Chrome, los timers (`setInterval` que resta 1s) se pausan o ralentizan cuando la pestaña está en segundo plano. Un descanso de 90s puede “congelarse” y no alertar al volver.

## Decisión

1. Guardar `targetEndTime = Date.now() + durationMs` al iniciar el descanso.
2. Usar `setInterval` solo para refrescar la UI: `secondsLeft = ceil((targetEndTime - Date.now()) / 1000)`.
3. En `visibilitychange` → `visible`, forzar sync; si ya expiró → 0 + alerta sonora + avanzar serie.
4. Desbloquear `HTMLAudioElement` en el gesto de **Comenzar entrenamiento** (política de autoplay).

## Consecuencias

- El tiempo real de descanso es correcto aunque el usuario minimice el navegador.
- El sonido puede no sonar *mientras* la app está suspendida (limitación del SO); al volver, se dispara si el descanso ya terminó.
- Duración por ejercicio: el trainer define `rest_time_seconds` en rutinas/plantillas (0–900; default 90). El player lee ese campo; si es `0`, avanza de serie sin pantalla de descanso.
- Feature **059**: `useTimer.adjust(deltaSeconds)` desplaza `targetEndTime` (±15 s en UI). Si el restante llega a ≤0, dispara la misma ruta de completado (alerta + avance). El anillo de progreso usa `restSecondsLeft / restDuration` (esta última también se ajusta en `useWorkoutSession.adjustRest`).
