# 044 · Plan — Catálogo ES + Scraping Fitcron

## Enfoque

1. DDL: añadir `name_es`, `description_es` (+ opcional `target_muscle_es`) a `exercises`.
2. Pedir permiso para dependencias npm (`axios`, `cheerio`) si no están en `backend/package.json`.
3. Script `backend/scripts/scrapeFitcronExercises.js`:
   - Fetch listado / páginas de detalle con delay configurable.
   - Parse HTML con cheerio.
   - Normalizar nombres EN/ES para fuzzy/exact match contra filas `exercises.name`.
   - Escribir CSV/JSON intermedio + upsert SQL parametrizado.
4. Extender service/API de exercises para devolver campos ES.
5. FE: helper `displayExerciseName(ex)` → `ex.name_es || ex.name` en catálogo y selects.
6. Documentar en `docs/` origen de datos, limitaciones legales/éticas y cómo re-ejecutar el script.

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
