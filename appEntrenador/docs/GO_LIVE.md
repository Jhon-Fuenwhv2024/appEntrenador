# Go-live — Cloudflare + Render + TiDB

## Ya hecho en TiDB

- Esquema `coach_db` importado (25 tablas).

## Obligatorias en Render (no van en Git)

Dashboard → `appentrenador` → Environment → añade **exactamente**:

```
NODE_ENV=production
JWT_SECRET=genera-un-secreto-largo-aleatorio-aqui

DB_HOST=TU_HOST_TIDB
DB_PORT=4000
DB_USER=TU_USUARIO_TIDB
DB_PASSWORD=TU_PASSWORD_TIDB
DB_NAME=coach_db
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

APP_PUBLIC_URL=https://entrenadorfit.jhonf172016.workers.dev
CORS_ORIGINS=https://entrenadorfit.jhonf172016.workers.dev
```

Settings del Web Service:


| Campo             | Valor                   |
| ----------------- | ----------------------- |
| Root Directory    | `appEntrenador/backend` |
| Build Command     | `npm install`           |
| Start Command     | `npm start`             |
| Health Check Path | `/health`               |


Tras guardar env → **Manual Deploy**.

Prueba: [https://appentrenador.onrender.com/health](https://appentrenador.onrender.com/health) → `{"success":true,"message":"ok"}`

## Frontend (repo)

`.env.production` ya tiene:

```
VITE_API_URL=https://appentrenador.onrender.com/api
```

Cloudflare Workers Builds debe:


| Campo              | Valor                 |
| ------------------ | --------------------- |
| Root / working dir | `appEntrenador`       |
| Build              | `npm run build`       |
| Deploy             | `npx wrangler deploy` |




## Commit + push

Sube estos cambios del repo; Render y Cloudflare redeployan desde Git.

## Orden de verificación

1. TiDB tablas OK (hecho).
2. Render env + health OK.
3. Cloudflare redeploy con `VITE_API_URL`.
4. Login en workers.dev con una cuenta creada fuera del repositorio.

