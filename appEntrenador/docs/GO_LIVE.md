# Go-live — Cloudflare + Render + TiDB

## Ya hecho en TiDB

- Esquema `coach_db` importado (25 tablas).
- Usuarios de prueba:
  - **demo_trainer** / `TrainfitDemo2026!`
  - **Camila123** / `Camila123` (trainer)
  - Cambia las passwords tras el primer login.

## Importar dump poblado (`db/coach_db.sql`)

Desde `backend/` (con las mismas `DB_*` que Render / TiDB):

```bash
# Windows PowerShell ejemplo
$env:DB_HOST="gateway01.ap-northeast-1.prod.aws.tidbcloud.com"
$env:DB_PORT="4000"
$env:DB_USER="TU_USER.root"
$env:DB_PASSWORD="TU_PASSWORD"
$env:DB_NAME="coach_db"
$env:DB_SSL="true"
node scripts/importSqlDump.js db/coach_db.sql
```

Eso **borra las tablas actuales** de `coach_db` e importa el dump phpMyAdmin.

## Obligatorias en Render (no van en Git)

Dashboard → `appentrenador` → Environment → añade **exactamente**:

```
NODE_ENV=production
JWT_SECRET=genera-un-secreto-largo-aleatorio-aqui

DB_HOST=gateway01.ap-northeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=3PR9n1htx4hCCG7.root
DB_PASSWORD=<1jkUAy4zdI2FQt5H>
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
4. Login en workers.dev con `demo_trainer` / `TrainfitDemo2026!`.

