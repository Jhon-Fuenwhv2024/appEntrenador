# 052 · Exportar informe PDF del alumno

**Estado:** pendiente (SDD)
**Depende de:** 039 (360), 027 (gráficas), 041/042 (PRs/rachas)
**Prioridad backlog:** ver `spec/constitution/roadmap.md` (043–052)

## Qué hace

Valor alto para trainers que reportan a clientes.

## Criterios de aceptación

### Base de datos / infraestructura

- [ ] Sin tablas nuevas obligatorias; opcional report_exports audit log

### Backend

- [ ] GET /clients/:id/report.pdf (trainer) — genera PDF server-side
- [ ] Incluye: resumen, sesiones periodo, PRs, racha, macros, composición
- [ ] Ownership estricto

### UI

- [ ] Botón Exportar PDF en Ficha 360
- [ ] Selector de rango de fechas

## Fuera de alcance

- Branding white-label por trainer
- Envío automático por email (puede reusar 049)
