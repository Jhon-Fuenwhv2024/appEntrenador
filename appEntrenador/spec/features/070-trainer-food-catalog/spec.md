# 070 · Mis alimentos (catálogo del trainer)

**Estado:** especificado  
**Depende de:** 043 (diet plans), 064 (ciclo), 069 (lookup externo como fallback)  
**Relacionada:** 008/009 (patrón catálogo ejercicios / biblioteca)

## Qué hace

Permite al entrenador mantener un **catálogo personal de alimentos** (“Mis alimentos”) con macros por 100 g/ml, semilla inicial de alimentos comunes LATAM, pantalla de gestión, y uso prioritario en el editor de dieta para rellenar kcal/P/C/G de forma rápida y fiable (sin depender de internet).

## Decisiones de producto

- **Catálogo por trainer** (no global compartido).
- **Semilla** ~20–40 alimentos LATAM (derivada de `staticNutrition` / alias 069).
- **Gestión** en pantalla propia (estilo catálogo de ejercicios en Biblioteca) **y** integración en `DietPlanForm`.
- Prioridad en editor: **catálogo trainer →** lookup 069 (USDA / OFF / static).
- Macros almacenados **por 100 g/ml**; al aplicar se escalan a `quantity`/`unit` (misma regla que 069).

## Criterios de aceptación

### Base de datos

- [ ] Tabla `trainer_foods`:
  - `id`, `trainer_id` (FK `usuarios`), `name`,
  - `calories`, `protein_g`, `carbs_g`, `fats_g` (valores por 100 g/ml),
  - `default_unit` (`g` | `ml` | `unidad` | `taza` | `cucharada` | `porción`),
  - `notes` nullable,
  - `created_at`, `updated_at`
- [ ] Unique `(trainer_id, name)` (nombre normalizado: trim + case-insensitive en service)
- [ ] Índice de búsqueda por `trainer_id` (+ texto `name`)
- [ ] Migración numerada + `ensureTrainerFoodsTable` + actualización `script_db.sql` / `docs/database-schema.md`

### Seed

- [ ] Dataset de ~20–40 alimentos comunes LATAM (nombre ES + macros/100g + unidad default)
- [ ] Seed **idempotente por trainer**: si el catálogo está vacío, insertar semilla; no duplicar en llamadas posteriores
- [ ] Disparo: automático en el primer `GET /trainer/foods` vacío **o** `POST /trainer/foods/seed` (documentar uno; preferir auto-seed silencioso + endpoint opcional)

### Backend

- [ ] Módulo Route → Controller → Service (ej. `backend/src/modules/trainer-foods/`)
- [ ] Auth: `authenticate` + `requireRole('trainer')`; filtrar siempre por `req.user.id`
- [ ] Endpoints:
  - `GET /api/trainer/foods?q=` — listar / buscar (dispara seed si vacío)
  - `POST /api/trainer/foods` — crear
  - `PUT /api/trainer/foods/:id` — actualizar (ownership)
  - `DELETE /api/trainer/foods/:id` — eliminar (ownership)
  - `POST /api/trainer/foods/seed` — (opcional) forzar seed si vacío
- [ ] Validación: nombre requerido; macros ≥ 0; unidad en allowlist
- [ ] Respuestas JSON unificadas; sin SQL en routes

### Frontend — Gestión

- [ ] Pantalla/lista de gestión (ruta bajo Biblioteca o `/trainer/foods` → hub biblioteca, mismo espíritu que ejercicios)
- [ ] Listar, buscar, crear, editar, eliminar alimentos del trainer
- [ ] Formulario: nombre, kcal/P/C/G por 100 g, unidad default, notes opcional
- [ ] Contraste ADR-0001; `tf-overlay-menu`; focus visible; targets táctiles; clearance bottom-nav

### Frontend — Editor de dieta

- [ ] En `DietPlanForm`: al tipar alimento, sugerencias del **catálogo trainer** primero
- [ ] Al elegir un ítem del catálogo: rellenar macros escalados a cantidad/unidad actuales
- [ ] Botón/acción **“Guardar en mis alimentos”** cuando hay nombre + macros y el alimento aún no está en el catálogo
- [ ] Si no hay match en catálogo: mantener flujo 069 (varita / blur lookup externo)
- [ ] No pisar macros no-cero en blur salvo forzar / selección explícita (misma regla 069)

### Docs

- [ ] `docs/api.md`, `docs/data-flows.md`, `docs/database-schema.md` actualizados en la implementación

## Fuera de alcance

- Catálogo global compartido entre trainers / marketplace
- Códigos de barras / escáner
- Registro diario de comida del cliente (053)
- Sustituir por completo el lookup 069 (sigue como fallback)
- Preview split del editor (067)
- Conversión inventada para `unidad`/`taza` sin serving conocido (igual que 069)
