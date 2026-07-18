# 044 · Plan — Catálogo ES + Scraping Fitcron

## Enfoque

1. DDL: añadir `name_es`, `description_es`, `target_muscle_es`, `local_media_path` a `exercises`.
2. Dependencias npm: `axios`, `cheerio`.
3. Script `backend/scripts/scrapeAndDownloadExercises.js`:
   - Fetch listado / páginas de detalle con delay 3–5 s + User-Agent.
   - Parse HTML con cheerio; match EN vía filename del GIF vs `exercises.name`.
   - Descargar GIF/MP4 a `public/uploads/exercises/exercise_{id}.{ext}` (skip si existe).
   - Modo `--dry-run` + upsert SQL parametrizado con `local_media_path`.
4. Extender service/API de exercises para devolver campos ES + path local.
5. FE: `displayExerciseName` + `resolveExerciseMediaSrc` (`API_ORIGIN + local_media_path`).
6. Documentar en `docs/exercises-i18n-scraping.md`.

## Decisiones

- Columnas en `exercises` (MVP más simple que tabla de traducciones).
- Cheerio primero; Puppeteer solo si fitcron es SPA sin HTML útil.
- Match: normalizar (lowercase, quitar puntuación); log de unmatched para curación manual.
- No commitear dumps enormes de HTML scrapiado; sí se puede versionar un JSON de traducciones generado si es manejable.

## Archivos clave

- DDL / migración / `script_db.sql`
- `backend/scripts/scrapeFitcronExercises.js`
- `backend/src/modules/exercises/*`
- FE: `ExercisesCatalogView.vue`, comboboxes de rutinas/biblioteca
- Docs: schema + nota de scraping ético

## Riesgos

- Cambios de markup en fitcron rompen el parser → versionar selectores y fallar con mensaje claro.
- ToS / robots: si el scraping no es viable, fallback a import manual de CSV curado con la misma columna `name_es`.
