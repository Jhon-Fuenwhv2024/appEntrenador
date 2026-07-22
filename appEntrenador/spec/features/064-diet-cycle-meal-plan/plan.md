# 064 · Plan — Ciclo nutricional multi-semana

## Enfoque

1. SDD en `spec/features/064-diet-cycle-meal-plan/`.
2. DDL: migración `028_diet_plan_cycle_days.sql` + `ensureDietPlansTables` + `script_db.sql`.
3. Reescribir `diet-plans.service.js`: días anidados, resolve-by-date, copy-day/week, sync media.
4. Routes/controller: endpoints cliente week + trainer copy.
5. FE trainer: panel/form ciclo (tabs semana + strip L–D).
6. FE cliente: día resuelto + strip semanal.
7. Docs api / schema / data-flows; build + smoke.

## Decisiones

- `dia_semana` ENUM idéntico a rutinas (`Lunes`…`Domingo`).
- `cycle_start_date` normalizado a lunes en service.
- Día vacío = empty state (sin fallback).
- Legacy: copiar meals a los 7 días de semana 1.
- Totales plan = media de días con items (también para sync 031).

## Archivos clave

- BE: `modules/diet-plans/*`, `028_*.sql`, `ensureDietPlansTables.js`, `script_db.sql`
- FE trainer: `DietPlanPanel.vue`, `DietPlanForm.vue`, `dietPlansApi.js`
- FE client: `ClientDietView.vue`, `dietPlansApi.js`
- Docs: `docs/api.md`, `docs/database-schema.md`, `docs/data-flows.md`
