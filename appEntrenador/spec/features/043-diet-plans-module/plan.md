# 043 · Plan — Módulo de Planes de Dieta

## Enfoque

1. DDL `diet_plans` / `diet_meals` / `diet_items` + migración numerada + ensure al arrancar + `script_db.sql`.
2. Módulo `backend/src/modules/diet-plans/` (routes → controller → service); montar en app Express.
3. Endpoints trainer (implementados):
   - `GET /api/trainer/diets?clientId=`
   - `POST /api/trainer/diets`
   - `GET /api/trainer/diets/:id`
   - `PUT /api/trainer/diets/:id` (reemplazo nested meals/items en transacción)
   - `DELETE /api/trainer/diets/:id`
   - `POST /api/trainer/diets/:id/activate` (marca activo para ese cliente; desactiva otros)
4. Endpoints cliente:
   - `GET /api/me/diet-plan` — plan activo + meals + items
5. Relación con 031: al activar (o guardar activo) se sincronizan totales del plan → `nutrition_targets`. Los objetivos diarios siguen editables **sin** plan de comidas.
6. FE trainer: `DietPlanPanel` + `DietPlanForm` en Client 360 pestaña nutrición.
7. FE cliente: `ClientDietView` en dashboard (`GET /me/diet-plan`).
8. Docs: schema, api, data-flows; métrica 035 “dietas por asignar” = alumnos sin `diet_plans` activo.

## Decisiones

- Un cliente puede tener varios planes históricos; como máximo **un** `is_active = 1` por `client_id`.
- Plantillas trainer (`client_id` NULL) opcionales en MVP; si complica, MVP solo planes ligados a cliente.
- Drag-and-drop: preferir reordenación simple (`sort_order` +/-) con Vuetify; librería DnD nueva solo con permiso.
- Macros en items son la fuente; totales de comida/plan = suma en service o computed FE (capa dual).

## Archivos clave

- BE: `modules/diet-plans/*`, migración `023_diet_plans.sql`, `script_db.sql`, `ensureDietPlansTables.js`
- FE trainer: `DietPlanPanel.vue` + `DietPlanForm.vue`
- FE client: `ClientDietView.vue`
- API: `features/trainer/api/dietPlansApi.js`, `features/client/api/dietPlansApi.js`
- Docs API / schema / data-flows
