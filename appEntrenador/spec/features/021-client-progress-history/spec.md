# 021 · Progreso / historial del cliente

**Estado:** pendiente

**Depende de:** 012; se beneficia de 019

## Qué hace

Da al **cliente** una vista de su historial/progreso (sesiones pasadas, pesos por ejercicio) y un resumen usable en la ficha del trainer. Hoy el historial casi solo lo consume el entrenador.

## Criterios de aceptación

- [ ] Cliente: `GET /me/workout-sessions` (o equivalente) lista sesiones propias
- [ ] UI cliente “Mi progreso” (ruta bajo shell o sección en dashboard) con sesiones y detalle de sets
- [ ] Trainer: resumen de progreso en ficha (reutilizar/mejorar listado 012)
- [ ] Ownership estricto; sin filtrar por IDs de otros usuarios
- [ ] Nav cliente: puede ser sección de Inicio o ítem extra **solo en client** (no añadir 5.º slot trainer)
- [ ] Docs api / data-flows
- [ ] Build OK

## Fuera de alcance

- Charts avanzados / comparativas sociales
- Export CSV/PDF
- Notificaciones al completar (025)
