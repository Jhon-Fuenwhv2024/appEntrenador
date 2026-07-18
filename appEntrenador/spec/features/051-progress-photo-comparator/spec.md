# 051 · Comparador de fotos de progreso

**Estado:** pendiente (SDD)
**Depende de:** 033 (check-ins / fotos)
**Prioridad backlog:** ver `spec/constitution/roadmap.md` (043–052)

## Qué hace

033 sube fotos; falta side-by-side / timeline visual.

## Criterios de aceptación

### Base de datos / infraestructura

- [ ] Reusar progress_photos; índices por client_id + created_at

### Backend

- [ ] GET /me/progress-photos?from=&to= y equivalente trainer
- [ ] Endpoint compare o listado ordenado para pares antes/después

### UI

- [ ] Cliente y trainer: slider o dual-pane front/side/back
- [ ] Timeline mensual

## Fuera de alcance

- Medición automática de silueta con ML
