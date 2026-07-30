# Feature 044 — Catálogo ES + media local (Fitcron)

## Objetivo

Catálogo de ejercicios con **nombre/descripción en español** y **GIF hosteados localmente** (sin depender de URLs externas en runtime).

Fuente: [fitcron.com/exercises](https://fitcron.com/exercises/).  
`robots.txt` permite crawl. El scraper **no** es un endpoint HTTP.

## Columnas DB

Migración: [`backend/db/migrations/024_exercises_i18n_local_media.sql`](../backend/db/migrations/024_exercises_i18n_local_media.sql)

| Columna | Tipo | Uso |
|---------|------|-----|
| `name_es` | VARCHAR(150) NULL | Nombre ES |
| `description_es` | TEXT NULL | Descripción ES |
| `target_muscle_es` | VARCHAR(100) NULL | Músculo principal ES |
| `local_media_path` | VARCHAR(500) NULL | Ej. `/uploads/exercises/exercise_12.gif` |

Ensure: `backend/src/db/ensureExercisesI18nColumns.js`.  
One-shot: `npm run db:add-exercises-i18n`.

## Static serving

`GET {API_ORIGIN}/uploads/exercises/exercise_{id}.gif` (público, fuera de `/api`).

- **Sin R2:** `express.static` sobre `backend/public/uploads/exercises/` (gitignored; `.gitkeep`).
- **Con R2** ([ADR-0005](decisions/ADR-0005-r2-exercise-gifs-trial.md)): Express hace proxy desde el prefijo `exercises/` del bucket; si el objeto falta, fallback a disco local.

La DB solo guarda `local_media_path` (ruta relativa); **no** binarios en TiDB.

El catálogo Fitcron (~750 GIFs) ya está en R2 (`exercises/…`, ADR-0005). Sin R2, se sirve desde `backend/public/uploads/exercises/`.

Si una rutina muestra “Sin demo visual”, falta vínculo a un ejercicio **con GIF local** (`local_media_path`).
Texto libre o catálogo wrkout sin GIF no sirve. Reparar:

```bash
cd backend
npm run db:backfill-exercise-links:confirm
```

Eso religa por nombre/`name_es`/aliases a ejercicios Fitcron con GIF y elimina reimports wrkout solo-imagen.  
Al programar, el autocomplete usa catálogo `enriched` (con GIF / `name_es`).

Al guardar rutinas/plantillas, el backend auto-resuelve `exercise_id` solo hacia catálogo con GIF.

## Flujo recomendado (catálogo = Fitcron con GIF)

```bash
cd backend

# 1) Importar Fitcron sin pareja (~600 INSERT + GIF). Omite los ya enriquecidos.
npm run scrape:exercises:import:dry   # preview
npm run scrape:exercises:import       # real (~40–80 min)

# 2) Borrar globales wrkout SIN media local (conserva los que tienen GIF)
npm run db:cleanup-exercises-no-local
npm run db:cleanup-exercises-no-local:confirm
```

Resultado esperado: ~752 ejercicios globales con GIF local.

### Flags scraper

| Flag | Efecto |
|------|--------|
| `--dry-run` | Solo reporta |
| `--import-missing` | `INSERT` si no hay match |
| `--skip-enriched` | Omite filas con `local_media_path` |
| `--skip-detail` | Sin `description_es` (más rápido) |
| `--limit=N` | Tope de acciones |
| `--delay-ms=N` | Delay fijo (default 3–5 s aleatorio) |

### Lógica

1. Lista Fitcron → nombre ES + URL GIF.
2. Match vs `exercises.name` / `name_es` (exacto + Jaccard).
3. Match → UPDATE + descarga si falta archivo.
4. Sin match + `--import-missing` → INSERT global + descarga.
5. Path: `/uploads/exercises/exercise_{id}.gif`.
6. Si R2 está configurado, tras guardar en disco también sube a `exercises/exercise_{id}.gif` (ADR-0005).

### Cleanup

Script: `scripts/cleanupExercisesWithoutLocalMedia.js`

- Conserva: `created_by_trainer_id IS NULL` **y** `local_media_path` no vacío.
- Borra: globales sin media local (seed wrkout solo-imagen).
- No toca privados del trainer.
- FK `exercise_id`: `ON DELETE SET NULL` (rutinas/plantillas no se rompen).
- Requiere `--confirm` para borrar.

## Frontend

`src/shared/utils/exerciseDisplay.js`: `name_es || name`, `API_ORIGIN + local_media_path`.  
Catálogo: filtro “Solo ES / media local”. Autocompletes: `getAllExercises()`.

## Nota ética / legal

- Rate-limit obligatorio; User-Agent identificable.
- Uso conforme a términos de Fitcron.
- No scraping continuo en producción sin revisión humana.
