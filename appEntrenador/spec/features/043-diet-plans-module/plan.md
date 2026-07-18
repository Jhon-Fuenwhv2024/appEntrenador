# 043 · Plan — Módulo de Planes de Dieta

## Enfoque

1. DDL `diet_plans` / `diet_meals` / `diet_items` + migración numerada + ensure al arrancar + `script_db.sql`.
2. Módulo `backend/src/modules/diet-plans/` (routes → controller → service); montar en app Express.
3. Endpoints propuestos (trainer):
   - `GET /api/diet-plans?clientId=`
   - `POST /api/diet-plans`
   - `GET /api/diet-plans/:id`
   - `PUT /api/diet-plans/:id` (reemplazo nested meals/items en transacción)
   - `DELETE /api/diet-plans/:id`
   - `POST /api/diet-plans/:id/activate` (marca activo para ese cliente; desactiva otros)
4. Endpoints cliente:
   - `GET /api/me/diet-plan` — plan activo + meals + items
5. Relación con 031: al activar un plan se puede sincronizar/actualizar `nutrition_targets` con totales del plan (opcional documentado); no eliminar 031.
6. FE trainer: feature bajo `src/features/trainer/` (panel en Client 360 pestaña nutrición + builder de comidas).
7. FE cliente: tarjeta/sección en dashboard o nutrición mostrando plan del día.
8. Docs: schema, api, data-flows; actualizar métrica 035 “dietas por asignar” para usar planes activos.

## Decisiones

- Un cliente puede tener varios planes históricos; como máximo **un** `is_active = 1` por `client_id`.
- Plantillas trainer (`client_id` NULL) opcionales en MVP; si complica, MVP solo planes ligados a cliente.
- Drag-and-drop: preferir reordenación simple (`sort_order` +/-) con Vuetify; librería DnD nueva solo con permiso.
- Macros en items son la fuente; totales de comida/plan = suma en service o computed FE.

## Archivos clave

- BE: `modules/diet-plans/*`, migración SQL, `script_db.sql`
- FE trainer: panel nutrición / nuevo `DietPlanBuilder.vue`
- FE client: widget plan dieta
- Shared API: `dietPlansApi.js`
- Docs API / schema
