# 076 · Modo sombra — presencia del coach sin videollamada

**Estado:** especificado (sin implementar)  
**Depende de:** 011/059 (Workout Player), 012 (sesión persistida), 034 (chat), 051/075 (push in-app)  
**Relacionada:** 039/060 (ficha 360), 025 (notificaciones)

## Qué hace

Permite al **entrenador** ver en tiempo casi real que un alumno está entrenando (ejercicio actual, serie, fase working/resting) y enviarle **pistas cortas (cues)** que aparecen dentro del Workout Player — **sin videollamada ni cámara**.

Diferenciador: presencia ligera en el momento del gym, no chat async ni Zoom.

## Personas

| Rol | Necesidad |
|-----|-----------|
| Trainer | Intervenir sin interrumpir el flujo del alumno ni abrir una call |
| Client | Recibir una pista clara en pantalla durante el descanso / serie |

## Decisiones de producto

- **Presencia opt-in del alumno:** el alumno puede desactivar “Permitir modo sombra” en ajustes (default: ON si está bajo un trainer).
- **Solo sesiones en curso:** la telemetría existe mientras hay una sesión abierta (`working` / `resting`); al cerrar/abandonar desaparece.
- **Cue = texto corto** (máx. ~120 caracteres) + opcional tono (`tip` | `form` | `motivation` | `stop`).
- **Sin audio/voz en MVP;** sin streaming de video.
- **Latencia aceptable:** polling o canal ligero cada ~3–5 s (no exige WebSocket en MVP si el plan elige poll).
- **Privacidad:** el trainer solo ve alumnos propios; el alumno ve que el trainer “está mirando” con un indicador discreto.
- **Historial de cues:** se guardan asociados a la sesión para revisión en ficha 360 (últimos N).

## Criterios de aceptación

### Producto / UX

- [ ] Trainer: lista “Entrenando ahora” con alumnos en sesión activa
- [ ] Trainer: detalle live (nombre ejercicio, índice, fase, tiempo de descanso restante si aplica)
- [ ] Trainer: enviar cue → confirmación; rate-limit razonable (p. ej. máx. 1 cada 10 s por alumno)
- [ ] Cliente: banner/toast en player con el cue; `aria-live` para accesibilidad
- [ ] Cliente: indicador “Tu entrenador puede ver esta sesión” + enlace a desactivar
- [ ] Si el alumno desactiva sombra: trainer no ve telemetría ni puede enviar cues
- [ ] Contraste ADR-0001 / a11y ADR-0002; usable ~390px; sin romper bottom-nav clearance

### Backend (contrato esperado)

- [ ] Endpoint(s) autenticados con ownership trainer↔client
- [ ] Publicación de snapshot de sesión por el cliente (o derivado del progreso ya persistido)
- [ ] Envío y entrega de cues; notificaciones in-app opcionales si el player no está en primer plano
- [ ] Route → Controller → Service; SQL parametrizado

### Docs (al implementar)

- [ ] `docs/api.md` + `docs/data-flows.md` (+ ADR si se elige WebSocket vs poll)

## Fuera de alcance

- Videollamada / screen share / corrección de forma por cámara o IA
- Chat de voz / notas de audio
- Multi-trainer mirando al mismo alumno
- Edición remota de la rutina desde modo sombra
- Modo sombra en sesiones ya cerradas (solo historial de cues)
