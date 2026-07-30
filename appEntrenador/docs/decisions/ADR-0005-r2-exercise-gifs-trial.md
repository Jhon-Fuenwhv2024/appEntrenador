# ADR-0005 · GIFs de ejercicios en Cloudflare R2 (trial Render)

**Estado:** aceptada  
**Fecha:** 2026-07-29  
**Alcance:** media del catálogo Fitcron (`/uploads/exercises`)  
**Relacionada:** [ADR-0004](ADR-0004-r2-avatars-trial.md) (mismo bucket R2), feature **068** (MinIO Coolify — diferida)

## Contexto

En Render el filesystem del contenedor es **efímero**. Los ~750 GIFs del catálogo viven en `backend/public/uploads/exercises` y se pierden en cada redeploy, mientras TiDB conserva `local_media_path`.

ADR-0004 ya resolvió avatares con R2. La feature 068 (MinIO) cubrirá todo el media en producción VPS, pero está diferida. Hace falta el mismo puente **ahora** para demos del player.

## Decisión

1. **Mismo bucket R2** y mismas env (`R2_*`) que avatares.
2. Prefijo de objetos: `exercises/exercise_{id}.gif`.
3. La DB **no** guarda binarios; sigue `local_media_path = /uploads/exercises/exercise_{id}.gif`.
4. Serve **público** (sin JWT): Express hace proxy `GetObject` cuando R2 está configurado; si el objeto falta, fallback a disco local (dev / transición).
5. Script one-shot `npm run db:upload-exercise-gifs-r2` sube el catálogo local al bucket.
6. El scraper Fitcron, tras guardar en disco, también hace `put` a R2 si está configurado.
7. Fotos de progreso (`/uploads/photos`) **siguen fuera** de R2 en esta fase.

## Coste

~636 MB de GIFs + avatares ≪ 10 GB free tier R2 Standard. Egress gratis. Vigilar Usage en el dashboard.

## Consecuencias

- Redeploy de Render **no** borra demos del catálogo ya subidas a R2.
- Tras el primer deploy con este código hay que ejecutar el upload one-shot desde una máquina que tenga los GIFs locales y las env R2 de producción.
- Cuando se active Coolify + MinIO (068), la misma capa S3 puede apuntar a otro endpoint sin cambiar `local_media_path`.

## Referencias

- Código: `backend/src/shared/storage/exerciseMediaStorage.js`, `authenticatePrivateUploads.js` (`serveExerciseGif`)
- Script de migración one-shot (ya ejecutado en trial): subió `public/uploads/exercises` → prefijo `exercises/`
- Deploy: `docs/deploy-render.md`
- Catálogo: `docs/exercises-i18n-scraping.md`
