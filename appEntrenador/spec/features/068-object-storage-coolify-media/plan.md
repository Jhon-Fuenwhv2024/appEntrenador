# 068 · Plan técnico

## Cuándo ejecutar

Solo al montar **producción real** con Coolify + VPS. No acoplar al trial Render/Cloudflare.

## Arquitectura objetivo

```text
Cliente Vue ──JWT upload──► Express (Coolify)
                               │
                               ├─ PutObject ──► MinIO (volumen persistente)
                               └─ metadatos ──► MySQL/TiDB
Cliente ◄── signed URL / URL pública ── MinIO
```

## Enfoque de implementación

1. **Abstracción** `shared/storage`:
   - `put({ key, body, contentType })`
   - `delete(key)`
   - `getSignedUrl(key, ttlSeconds)` (privados)
   - Config por env; si no hay `S3_*` → driver local bajo `public/uploads` (dev).
2. **Coolify:** servicio MinIO + volume; bucket `trainfit-media`; secrets en env del servicio API.
3. **Wiring uploads existentes:**
   - `uploadAvatar` / profile + account
   - `uploadProgressPhotos` / checkins
   - scripts seed/scrape ejercicios → put a `exercises/global/...`
4. **Upload trainer (si aún solo URL):** endpoint o extensión de `POST/PATCH exercises` para archivo + cuotas FREE/PRO.
5. **Migración one-shot** de GIFs locales si existen en el servidor de corte.
6. **Docs + ADR.**

## Prefijos de claves

| Prefijo | Visibilidad |
|---------|-------------|
| `avatars/` | Privado |
| `photos/` | Privado |
| `exercises/global/` | Público lectura |
| `exercises/trainer/{trainerId}/` | Trainer + sus clientes |

## Cuotas sugeridas (ajustar al implementar)

| Plan | Media propia trainer | Máx. por archivo demo |
|------|----------------------|------------------------|
| FREE | p. ej. 10 archivos / 50 MB total | 10 MB (gif/mp4) |
| PRO  | p. ej. 100 archivos / 2 GB total | 50–100 MB (mp4 preferido) |

Avatares/fotos de progreso: límites actuales (~2 MB / ~5 MB), sin cupo SaaS agresivo en v1.

## Dependencias npm (pedir permiso al implementar)

- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`

## Seguridad (skill auth-roles)

- Uploads solo con JWT + rol/ownership.
- No bucket totalmente público con avatares/fotos.
- Signed URLs con TTL corto (5–15 min) para privados.
- Nunca secretos S3 en Git.

## Alternativa de escala (post-v1)

Si el VPS satura disco/banda por vídeos: mismo código, cambiar `S3_ENDPOINT` a Cloudflare R2 (u otro S3). Sin reescritura de dominio de negocio.
