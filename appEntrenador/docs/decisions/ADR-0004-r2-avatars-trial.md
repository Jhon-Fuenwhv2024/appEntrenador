# ADR-0004 · Avatares en Cloudflare R2 (trial Render)

**Estado:** aceptada  
**Fecha:** 2026-07-25  
**Alcance:** solo fotos de perfil (`/uploads/avatars`)

## Contexto

En el despliegue de prueba (API en Render), el filesystem del contenedor es **efímero**: cada redeploy borra `backend/public/uploads/avatars` mientras TiDB conserva `foto_url`. Las fotos de perfil “desaparecen”.

La feature **068** (MinIO/S3 en Coolify) cubrirá todo el media en producción VPS, pero está diferida. Hace falta una solución mínima **ahora** solo para avatares.

## Decisión

1. **Cloudflare R2** (S3-compatible, storage Standard) como backend de objetos para avatares cuando están definidas:
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
2. Multer usa **memoryStorage** si R2 está activo; **diskStorage** si no (dev local).
3. La DB sigue guardando solo la ruta lógica `/uploads/avatars/user_{id}.{ext}` (sin URL pública de R2).
4. El serve sigue pasando por Express con **JWT** (`Bearer` o `?token=`): proxy `GetObject` desde R2. Bucket **privado** (no público, no custom domain).
5. Fotos de progreso **no** usan R2 en esta fase. Media de ejercicios (GIFs del catálogo) → [ADR-0005](ADR-0005-r2-exercise-gifs-trial.md).

## Coste

R2 free tier permanente (Standard): 10 GB storage, 1M Class A, 10M Class B, egress gratis. Solo avatares ≤2 MB quedan muy por debajo. No usar Infrequent Access.

## Consecuencias

- Redeploy de Render **no** borra fotos de perfil ya subidas a R2.
- Tras activar R2 hay que **re-subir** avatares que solo existían en disco efímero.
- Cuando se active Coolify + MinIO (068), la misma capa S3 puede apuntar a otro endpoint sin cambiar el contrato de `foto_url`.

## Referencias

- Código: `backend/src/shared/storage/`, `uploadAvatar.js`, `authenticatePrivateUploads.js`
- Deploy: `docs/deploy-render.md`
- Feature futura: `spec/features/068-object-storage-coolify-media/`
