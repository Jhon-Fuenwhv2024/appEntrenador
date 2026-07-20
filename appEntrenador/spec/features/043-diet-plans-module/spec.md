# 043 · Módulo de Planes de Dieta

**Estado:** implementado (capa dual macros FE + BE)
**Depende de:** 031 (macros MVP / `nutrition_targets`), 020 / 039 (ficha alumno)
**Relacionada:** 035 (métrica “dietas por asignar”), backlog registro diario de comida (046+)

## Qué hace

Permite al entrenador **crear y asignar planes de dieta** a clientes (comidas + alimentos con macros) y al cliente **ver su plan / consumo previsto** del día. Complementa 031 (objetivo diario fijo) con estructura de comidas.

## Criterios de aceptación

### Base de datos

- [x] Tabla `diet_plans`:
  - `id`, `trainer_id`, `client_id` (nullable si plantilla), `title`, `notes`,
  - macros objetivo opcionales: `calories`, `protein_g`, `carbs_g`, `fats_g`,
  - `is_active`, `created_at`, `updated_at`
- [x] Tabla `diet_meals`:
  - `id`, `diet_plan_id`, `name` (ej. Desayuno), `sort_order`, `time_hint` opcional
- [x] Tabla `diet_items`:
  - `id`, `diet_meal_id`, `food_name`, `quantity`, `unit`,
  - `calories`, `protein_g`, `carbs_g`, `fats_g`, `sort_order`
- [x] Migración + ensure + actualización de `script_db.sql`
- [x] Ownership: plan pertenece al trainer; cliente solo lee el suyo activo

### Backend

- [x] Módulo Route → Controller → Service (ej. `backend/src/modules/diet-plans/`)
- [x] CRUD trainer: crear/editar/listar/eliminar plan; asignar/activar a cliente
- [x] Nested write de meals + items en transacción
- [x] `GET` cliente: plan activo del alumno autenticado (`/me/diet-plan` o equivalente)
- [x] Validación de ownership con `req.user`; errores JSON unificados
- [x] Sin SQL en routes

### Frontend — Entrenador

- [x] UI de creación/edición: agregar comidas e items (arrastrar si el stack lo permite; como mínimo agregar/reordenar)
- [x] Macros visibles por item, comida y total del plan
- [x] Entrada desde ficha 360 / nutrición (reemplazar o complementar placeholder “Planes de Dieta / Próximamente”)
- [x] Contraste Trainfit (`color="primary"`, overlays correctos)

### Frontend — Cliente

- [x] Vista de consumo / plan del día: comidas e items con macros
- [x] Solo lectura del plan activo (logging diario de lo comido = fuera de alcance)

## Fuera de alcance

- Base de datos global de alimentos / barcodes
- Registro diario de adherencia comida a comida (backlog nutrición fase 2)
- Recetas compartidas entre trainers / marketplace
