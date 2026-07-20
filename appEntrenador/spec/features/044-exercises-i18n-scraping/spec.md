# 044 · Catálogo de Ejercicios i18n (ES) + Scraping

**Estado:** implementado (MVP — Epic Fitness Fase 3)
**Depende de:** 008 / 009 (catálogo `exercises`), 022 (`exercise_id` en líneas)
**Relacionada:** nice-to-have multi-idioma global (vue-i18n) — fuera de esta feature

## Qué hace

Enriquece el catálogo de ejercicios (hoy en inglés, seed wrkout) con **nombres y descripciones en español**, obtenidas de forma ética desde [fitcron.com/exercises](https://fitcron.com/exercises/) mediante un **script Node.js independiente** (no en request HTTP). La API/UI muestran español cuando exista, con fallback a inglés.

## Criterios de aceptación

### Base de datos

- [x] Columnas en `exercises` (preferido MVP):
  - `name_es` VARCHAR nullable
  - `description_es` TEXT nullable
  - opcional: `target_muscle_es` VARCHAR nullable
- [x] Alternativa aceptable: tabla `exercise_translations` (`exercise_id`, `locale`, `name`, `description`, UNIQUE)
- [x] Migración + ensure + `script_db.sql`
- [x] Mapeo estable: preferir match por nombre EN / slug; documentar tasa de match y casos sin pareja

### Script de scraping

- [x] Script en `backend/scripts/` (ej. `scrapeFitcronExercises.js`), ejecutable con `node`
- [x] Stack: `axios` + `cheerio` preferido; Puppeteer solo si el HTML lo exige
- [x] Extrae: nombre ES, descripción, músculos implicados (según disponibilidad en la página)
- [x] Scraping ético: respetar `robots.txt` / ToS, rate-limit, User-Agent identificable, sin martillar el sitio
- [x] Modos: `--dry-run` (solo reportar matches) y upsert a DB
- [x] No exponer el scraper como endpoint público

### Backend / API

- [x] Listados de ejercicios incluyen campos ES (o locale)
- [x] FE trainer/cliente puede preferir `name_es || name` (y description equivalente)
- [x] Crear/editar ejercicio custom del trainer sigue funcionando; ES opcional

### Frontend

- [x] Catálogo y comboboxes muestran etiqueta en español cuando `name_es` exista
- [x] Sin adoptar vue-i18n completo en esta feature

## Fuera de alcance

- Traducir toda la UI de la app (multi-idioma producto)
- Scraping continuo en producción / cron sin revisión humana
- ~~Sustituir media/GIF del seed wrkout~~ — **decisión explícita:** descargar y hostear media Fitcron en `local_media_path` (mantener `media_url` como fallback)
- Reclamar propiedad del contenido de terceros; uso conforme a términos del sitio fuente
