# 075 · Notificaciones: UX, recordatorio, membresía y racha

**Estado:** implementado  
**Depende de:** 025/074 (campana), 051 (push), 040 (membresía), 042 (rachas), 038 (hoy)

## Alcance

1. **Rediseño UI** de campana + soft-prompt + card push (sin preferencias por tipo: sigue recibiendo todo).
2. **Recordatorio de entrenamiento** — si hoy hay rutina y no está completada; hora configurable por el alumno (default 08:00, TZ `America/Bogota`).
3. **Avisos de membresía** — cliente a 7/3/1 días y vencida; trainer avisos por alumno por vencer.
4. **`streak_at_risk`** — emitir in-app + push si racha > 0 y sin entreno ayer.
5. **Guía iOS** — copy corto en card de push (Añadir a pantalla de inicio).

## Fuera de alcance

- Preferencias por tipo, silencio global en app (salvo chat ya hecho), marcar leída al abrir push.
