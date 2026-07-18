# 050 · Nutrición fase 2: registro diario de comida

**Estado:** pendiente (SDD)
**Depende de:** 031 (macros targets)
**Prioridad backlog:** ver `spec/constitution/roadmap.md` (043–052)

## Qué hace

031 solo asigna macros; falta diario y adherencia real.

## Criterios de aceptación

### Base de datos / infraestructura

- [ ] Tabla food_logs: client_id, log_date, meal_type, description, calories, protein_g, carbs_g, fats_g

### Backend

- [ ] CRUD /me/food-logs (client)
- [ ] GET /clients/:id/food-logs (trainer read)
- [ ] Adherencia % vs nutrition_targets

### UI

- [ ] Cliente: registro rápido del día + progreso vs target
- [ ] Trainer: lectura en Ficha 360 pestaña nutrición

## Fuera de alcance

- Base de alimentos con barcodes
- IA photo-to-macros
