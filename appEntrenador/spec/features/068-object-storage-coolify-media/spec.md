# 068 · Object storage de media (Coolify + VPS)

**Estado:** diferida (implementar al configurar producción real con Coolify + VPS)  
**Depende de:** 020 (avatares), 033 (fotos check-in), 008/009/044 (catálogo + media local), 037 (planes FREE/PRO)  
**Relacionada:** backlog **049** (deploy) — esta feature sustituye el enfoque “disco del contenedor / Netlify Blobs” para archivos; el deploy Coolify puede vivir en 049 o en docs de go-live.

## Qué hace

Sustituye el almacenamiento de archivos en `backend/public/uploads` (filesystem del proceso/contenedor) por **object storage S3-compatible** (MinIO en Coolify en el VPS), de modo que:

1. Avatares, fotos de progreso y GIFs/vídeos de ejercicios **sobreviven a redeploys**.
2. Muchos trainers pueden subir media propia sin llenar el disco del contenedor del API de forma opaca.
3. El código usa una **capa de abstracción S3** (endpoint configurable → MinIO hoy, R2/Wasabi mañana sin reescribir uploads).

## Contexto

- El despliegue actual (p. ej. Render + Cloudflare) es de **prueba**; el disco efímero ya documenta pérdida de `/uploads`.
- Producción objetivo: **Coolify en VPS** (API Express + DB + frontend + MinIO).
- Hoy: Multer `diskStorage` → `public/uploads/{avatars,photos,exercises}`; privados con JWT (`authenticatePrivateUploads`); ejercicios públicos.

## Criterios de aceptación

### Infra Coolify (cuando se active prod)

- [ ] Servicio **MinIO** en Coolify con **volumen persistente**.
- [ ] Bucket `trainfit-media` (o nombre acordado) + credenciales solo en env Coolify.
- [ ] Env API: `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, opcional `S3_PUBLIC_BASE_URL`.
- [ ] Redeploy del API **no** borra objetos ya subidos.

### Capa de storage (backend)

- [ ] Módulo `backend/src/shared/storage/` (o equivalente): `put`, `delete`, `signedGetUrl` / serve policy.
- [ ] Driver **S3** (AWS SDK compatible) + driver **local** si faltan env (dev XAMPP sin MinIO).
- [ ] Multer pasa a memory (o stream) → `storage.put`; no depender del FS del contenedor en prod.

### Tipos de media

- [ ] **Avatares** — prefijo `avatars/{userId}.*`; privados (signed URL o proxy JWT); límites ~2 MB; JPEG/PNG/WebP.
- [ ] **Fotos check-in** — prefijo `photos/{clientId}/...`; privados; ownership trainer↔client intacto.
- [ ] **Ejercicios globales** — prefijo `exercises/global/...`; lectura pública estable.
- [ ] **Media trainer** — prefijo `exercises/trainer/{trainerId}/{uuid}.*`; visible al trainer y sus clientes; ownership por `created_by_trainer_id`.

### Multi-trainer / cuotas

- [ ] Límites por plan SaaS (FREE vs PRO): cantidad y/o MB de media propia del trainer (valores concretos en `plan.md` al implementar).
- [ ] Validación mime + tamaño en API; rechazo claro con JSON de error unificado.
- [ ] Preferencia documentada: demos cortas = MP4/WebM; demos largas = `media_type: youtube` + URL (no hostear archivos enormes en el VPS).

### Datos y compatibilidad

- [ ] DB sigue guardando solo metadatos/URLs (`foto_url`, `image_url`, `local_media_path` / `media_url`); sin binarios en MySQL/TiDB.
- [ ] Paths existentes migrables (script one-shot de `public/uploads/exercises` → bucket si hay archivos locales).
- [ ] Frontend sigue resolviendo media vía origin/API o URL pública/firmada sin romper player/preview.

### Docs

- [ ] ADR en `docs/decisions/` (MinIO + Coolify + cuotas).
- [ ] Actualizar `docs/api.md`, `docs/data-flows.md`, go-live/deploy Coolify.
- [ ] Nota en `spec/constitution/tech-stack.md`: despliegue Coolify + media MinIO.

## Fuera de alcance

- Migrar el API a Netlify Functions / Netlify Blobs / Netlify Image CDN.
- Cloudflare Stream / transcoding HLS multi-bitrate.
- CDN externo obligatorio en v1 (opcional más adelante si el VPS satura banda).
- Cambiar el modelo de roles o el SaaS FREE/PRO más allá de cuotas de storage.
- Implementar esta feature en el entorno de prueba Render mientras no exista Coolify+VPS.

## Notas de timing

**No implementar** hasta el proyecto de configuración de producción real (Coolify + VPS). Hasta entonces el trial puede seguir con disco local consciente de que no es durable.
