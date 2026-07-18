# 044 · Catálogo de Ejercicios i18n (ES) + Scraping

**Estado:** pendiente (SDD listo — Epic Fitness Fase 3)
**Depende de:** 008 / 009 (catálogo `exercises`), 022 (`exercise_id` en líneas)
**Relacionada:** nice-to-have multi-idioma global (vue-i18n) — fuera de esta feature

## Qué hace

Enriquece el catálogo de ejercicios (hoy en inglés, seed wrkout) con **nombres y descripciones en español**, obtenidas de forma ética desde [fitcron.com/exercises](https://fitcron.com/exercises/) mediante un **script Node.js independiente** (no en request HTTP). La API/UI muestran español cuando exista, con fallback a inglés.

## Criterios de aceptación

### Base de datos

- [ ] Columnas en `exercises` (preferido MVP):
  - `name_es` VARCHAR nullable
  - `description_es` TEXT nullable
  - opcional: `target_muscle_es` VARCHAR nullable
- [ ] Alternativa aceptable: tabla `exercise_translations` (`exercise_id`, `locale`, `name`, `description`, UNIQUE)
- [ ] Migración + ensure + `script_db.sql`
- [ ] Mapeo estable: preferir match por nombre EN / slug; documentar tasa de match y casos sin pareja

### Script de scraping

- [ ] Script en `backend/scripts/` (ej. `scrapeFitcronExercises.js`), ejecutable con `node`
- [ ] Stack: `axios` + `cheerio` preferido; Puppeteer solo si el HTML lo exige
- [ ] Extrae: nombre ES, descripción, músculos implicados (según disponibilidad en la página)
- [ ] Scraping ético: respetar `robots.txt` / ToS, rate-limit, User-Agent identificable, sin martillar el sitio
- [ ] Modos: `--dry-run` (solo reportar matches) y upsert a DB
- [ ] No exponer el scraper como endpoint público

### Backend / API

- [ ] Listados de ejercicios incluyen campos ES (o locale)
- [ ] FE trainer/cliente puede preferir `name_es || name` (y description equivalente)
- [ ] Crear/editar ejercicio custom del trainer sigue funcionando; ES opcional

### Frontend

- [ ] Catálogo y comboboxes muestran etiqueta en español cuando `name_es` exista
- [ ] Sin adoptar vue-i18n completo en esta feature

## Fuera de alcance

- Traducir toda la UI de la app (multi-idioma producto)
- Scraping continuo en producción / cron sin revisión humana
- Sustituir media/GIF del seed wrkout por assets de fitcron (solo texto/metadatos ES salvo decisión explícita)
- Reclamar propiedad del contenido de terceros; uso conforme a términos del sitio fuente
