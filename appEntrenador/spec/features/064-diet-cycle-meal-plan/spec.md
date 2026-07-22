# 064 · Ciclo nutricional multi-semana

**Estado:** implementado  
**Depende de:** 043 (planes de dieta), 031 (nutrition_targets), 057 (jerarquía visual cliente)  
**Relacionada:** 061 (vista semanal L–D en Programación), backlog 053 (registro diario)

## Qué hace

Convierte el plan de dieta **plano** (mismas comidas todos los días) en un **ciclo multi-semana** (2–4 semanas × L–D). El entrenador programa comidas distintas por día/semana; el cliente ve el día resuelto según la fecha y el ancla del ciclo.

## Criterios de aceptación

### Base de datos

- [x] `diet_plans` incluye `cycle_length_weeks` (2|3|4, default 4) y `cycle_start_date` (DATE, ancla lunes).
- [x] Tabla `diet_plan_days`: `week_index`, `dia_semana` ENUM L–D, macros cacheados, UNIQUE `(plan, week, día)`.
- [x] `diet_meals` cuelga de `diet_day_id` (no de `diet_plan_id`).
- [x] Migración `028` + ensure + `script_db.sql`; backfill legacy → semana 1 × 7 días (copia meals).

### Backend

- [x] CRUD trainer con payload `days[]` → meals → items (transacción).
- [x] `GET /me/diet-plan?date=` resuelve week_index + dia_semana; sin fallback a otro día.
- [x] `GET /me/diet-plan/week?date=` preview de la semana del ciclo.
- [x] `POST .../copy-day` y `POST .../copy-week` (deep copy).
- [x] Sync 031: media de días con ≥1 item al activar/guardar activo.
- [x] Ownership vía `req.user`; Route → Controller → Service.

### Frontend — Entrenador

- [x] Meta: título, cycle_length, cycle_start, activo.
- [x] Tabs Semana 1…N + strip L–D + builder por día.
- [x] Duplicar día / duplicar semana / limpiar día.
- [x] Contraste ADR-0001; usable ~390px.

### Frontend — Cliente

- [x] Cabecera Hoy · Semana X · día + comidas del día resuelto (057).
- [x] Strip L–D de la semana actual; empty state si el día no tiene comidas.

### Docs / validación

- [x] `docs/api.md`, `database-schema.md`, `data-flows.md` actualizados.
- [x] Build FE OK; smoke API básico (resolve + validate payload).

## Fuera de alcance

- Registro diario de adherencia (053).
- Catálogo global de alimentos / grocery list / AI.
- Ciclos >4 semanas u overrides por fecha absoluta.
