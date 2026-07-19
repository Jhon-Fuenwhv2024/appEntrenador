# Etiquetado muscular HITL (herramienta interna)

Flujo Human-in-the-loop para clasificar rápidamente el catálogo `exercises` con músculo principal (requerido) y secundarios (opcionales).

## Acceso

- Rol: usuario con `is_superadmin = true`
- UI: `/admin/exercises/tagger`
- Entrada también desde Panel SaaS (`/backoffice`) y sidebar (icono etiqueta)

## Base de datos

Columnas en `exercises`:

| Columna | Tipo | Uso |
|---------|------|-----|
| `primary_muscle` | VARCHAR(100) NULL | Músculo principal |
| `secondary_muscles` | JSON NULL | Array de strings |
| `is_warmup` | TINYINT(1) DEFAULT 0 | 1 = calentamiento para esa musculatura |

Migración: `backend/db/migrations/025_exercises_muscle_tags.sql`  
One-shot: `npm run db:add-exercises-muscle-tags` (en `backend/`)  
Al arrancar el API también se ejecuta `ensureExercisesMuscleTags()`.

## API

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/admin/exercises/untagged` | Un ejercicio con `primary_muscle` vacío |
| PATCH | `/api/admin/exercises/:id/tag` | Guarda etiquetas y responde 200 |

Taxonomía (FE + BE): Braquial, Femoral, Cuádriceps, Gemelos, Antebrazo, etc.  
Nota MariaDB: `secondary_muscles` se guarda como string JSON (sin `CAST(... AS JSON)`).

Detalle de contratos: [`docs/api.md`](api.md) (sección Admin HITL).

## Frontend

- `src/features/admin/ExerciseTaggerView.vue`
- Composable `useExerciseTagger.js`
- Taxonomía fija en `constants/muscles.js`

Tras guardar, limpia selección y pide el siguiente untagged. Si no hay más, muestra «¡Catálogo completado al 100%!».

La UI muestra barra de progreso (`meta` del GET untagged): % completado, etiquetados y faltantes.

## Uso en catálogo / rutinas (estilo Hevy)

Las etiquetas HITL alimentan el catálogo trainer y los pickers de rutina/plantilla:

- Display: `primary_muscle` tiene prioridad sobre `target_muscle*`.
- Chips horizontales “Todos / Pecho / … / Calentamiento” para filtrar rápido.
- API: `GET /exercises?muscle=Pecho&warmup=1`.
