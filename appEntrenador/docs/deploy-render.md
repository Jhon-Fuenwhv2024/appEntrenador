# Despliegue backend en Render (gratis)

## Qué cambió en el código

- `src/config/db.js` lee `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`.
- `src/config/env.js` exporta `CORS_ORIGINS` y `NODE_ENV`.
- `src/server.js` escucha en `0.0.0.0`, CORS por lista, healthchecks `/health` y `/api/health`.

## Render — Web Service

| Campo | Valor |
|--------|--------|
| Runtime | Node |
| Root Directory | `appEntrenador/backend` (si el repo git es el padre `appEntrenador`) |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| Instance | Free |

## Variables de entorno (Render → Environment)

Obligatorias:

```
NODE_ENV=production
JWT_SECRET=<secreto-largo-aleatorio>
DB_HOST=<host-mysql>
DB_PORT=3306
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=coach_db
APP_PUBLIC_URL=https://entrenadorfit.<tu-cuenta>.workers.dev
CORS_ORIGINS=https://entrenadorfit.<tu-cuenta>.workers.dev
```

### TiDB Serverless (URL `mysql://USER:PASS@HOST:4000/coach_db`)

Desglosa la URL en variables (no pegues la URL completa en el código):

```
DB_HOST=gateway01.REGION.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=<cluster>.root
DB_PASSWORD=<password>
DB_NAME=coach_db
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

Importa el esquema una vez:

```bash
mysql -h DB_HOST -P 4000 -u DB_USER -p --ssl-mode=REQUIRED < appEntrenador/backend/db/script_db.sql
```

O desde el SQL editor de TiDB Cloud: pega/ejecuta el contenido de `backend/db/script_db.sql`.

Si la DB exige TLS (TiDB / Aiven / etc.):

```
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

SMTP (opcional, mismos nombres que local):

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=<api-key>
SMTP_FROM=Trainfit <onboarding@resend.dev>
```

## Frontend (Cloudflare)

En el build del Worker/Pages:

```
VITE_API_URL=https://<tu-servicio>.onrender.com/api
```

## MySQL / TiDB

Render free **no** incluye MySQL. Usa TiDB Serverless.

Checklist go-live: [`docs/GO_LIVE.md`](GO_LIVE.md).

Importa el esquema con `backend/db/script_db.sql` (ya aplicado en el cluster del proyecto vía MCP si corresponde).

## Notas

- Disco efímero: avatares/fotos en `public/uploads` se pierden al redeploy (luego R2/S3).
- Free tier: cold start tras inactividad (~30–60 s).
- Verifica: `GET https://<servicio>.onrender.com/health` → `{ "success": true, "message": "ok" }`.
