# 060 · Resumen Client 360: densidad y progressive disclosure

**Estado:** implementado  
**Depende de:** 039 (ficha 360), 040 (membresía), 042 (consistencia), 012/021 (sesiones)  
**Alimenta:** UX del tab Resumen en `/trainer/clients/:clientId`

## Qué hace

Rediseña el tab **Resumen** del Client 360 (modo entrenador) para que sea un glance de 30–60s: membresía en modo vista/edición, consistencia compacta y historial de entrenamientos agrupado por día con paginación («Ver más»), sin perder CRUD existente.

## Criterios de aceptación

### Membresía

- [x] Por defecto se muestra una **card de estado** (badge, rango de fechas, bloqueo, preview de notas), no el formulario completo.
- [x] CTA **Editar** / **Asignar membresía** abre el formulario; **Guardar** o **Cancelar** vuelven a vista.
- [x] Tras guardar, el header sticky se actualiza vía `@updated` (sin regresión 040).

### Consistencia

- [x] Strip compacto: Score | Racha | Mejor | Meta semana `n/m`.
- [x] Meta semanal editable solo bajo demanda (lápiz → input + Guardar/Cancelar).

### Historial

- [x] Sesiones agrupadas por día (`Hoy` / `Ayer` / fecha).
- [x] Primera carga ~8 sesiones; botón **Ver más** con `limit`/`offset` en API trainer.
- [x] Accordion de series intacto; portal cliente (`GET /me/workout-sessions`) sigue devolviendo array (compat 021).

### UX / tema

- [x] Contraste ADR-0001; CTA `color="primary"`; clearance bottom nav intacto.
- [x] Widgets de decisión quedan más cerca del primer viewport.

## Fuera de alcance

- Tabs Programación / Nutrición / Medidas / Check-In / Gráficas / Chat.
- Rediseño del header sticky.
- Virtualización DOM.
- Cambiar lógica de período +30 días.
