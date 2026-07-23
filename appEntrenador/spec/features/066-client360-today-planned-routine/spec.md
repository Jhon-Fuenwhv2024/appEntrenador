# 066 · Rutina programada de hoy en Actividad reciente (Client 360)

**Estado:** especificado  
**Depende de:** 060 (Resumen Client 360 / Actividad reciente), 039 (ficha 360), rutinas por `dia_semana`  
**Alimenta:** glance del tab Resumen en `/trainer/clients/:clientId`

## Qué hace

En la sección **Actividad reciente** del perfil 360 (modo trainer), la columna **Hoy** muestra la rutina **programada** para el día de la semana actual aunque el alumno aún no la haya iniciado o completado. Así el entrenador ve de un vistazo qué toca hoy, no solo lo ya logueado en `workout_sessions`.

Hoy (gap 060): Hoy/Ayer solo listan sesiones (`completed` / `abandoned`). Sin sesión → “Sin entrenamientos hoy”, aunque exista fila en `rutinas` para ese `dia_semana`.

## Criterios de aceptación

### Datos

- [ ] Se obtiene la rutina de hoy desde `rutinas` del cliente (`dia_semana` = weekday local, misma convención que el portal cliente: `es-ES` long → `Lunes`…`Domingo`).
- [ ] No se crean filas falsas en `workout_sessions`; la fila “planificada” es solo UI (o campo sintético en el FE).

### UI — columna Hoy

- [ ] Si hay rutina para hoy y **no** hay sesión de hoy asociada a esa rutina (`routine_id`) → mostrar fila con:
  - nombre = `nombre_rutina`
  - badge **Pendiente**
  - icono distinto (p. ej. calendario / reloj)
  - no expandible a series (o sin accordion de sets)
- [ ] Si ya hay sesión de hoy para esa rutina (completada o abandonada) → mostrar solo la sesión real (sin duplicar “Pendiente”).
- [ ] Empty “Sin entrenamientos hoy” solo cuando no hay sesión **ni** rutina programada para hoy.
- [ ] Contador de Hoy incluye la fila pendiente cuando aplique.

### Ayer / anteriores

- [ ] Sin cambio de alcance: Ayer y días anteriores siguen basados en sesiones reales (no inventar pendientes históricos).

### UX / tema

- [ ] Contraste ADR-0001; badge Pendiente distinguible de Completada / Sin completar (no solo color).
- [ ] Clearance bottom nav intacto; usable ~390px.

## Fuera de alcance

- Cambiar el player del cliente o `GET /me/today`.
- Programación multi-rutina el mismo día (si hay más de una, definir en implementación: mostrar la primera o todas; por defecto todas las sin sesión hoy).
- Notificaciones push al trainer.
- Editar rutina desde la fila pendiente (solo lectura / enlace opcional futuro).
