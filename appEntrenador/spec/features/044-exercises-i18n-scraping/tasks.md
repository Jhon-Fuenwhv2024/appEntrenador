# 044 · Tasks

- [x] Crear SDD (spec / plan / tasks)
- [x] DDL: `name_es` / `description_es` / `target_muscle_es` / `local_media_path` + migración + ensure + `script_db.sql`
- [x] Dependencias: `axios` + `cheerio` en backend
- [x] Script scrape Fitcron + descarga local: dry-run + upsert + rate-limit / UA (`scrapeAndDownloadExercises.js`)
- [x] BE: API exercises expone campos ES + `local_media_path`; enrich rutinas cliente
- [x] FE: display `name_es || name` + media local (mp4/gif) en catálogo, selects y player
- [x] Docs: schema + instrucciones de re-ejecución + nota ética
- [x] Validar script dry-run + build FE
- [x] `--import-missing`: INSERT Fitcron sin match + GIF local (600)
- [x] Cleanup: borrar globales sin `local_media_path` (745 wrkout imagen)
- [x] Catálogo final ~752 globales con GIF local
