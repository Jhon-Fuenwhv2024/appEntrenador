# Despliegue frontend en Cloudflare (Workers + assets)

## Problema que evita esta config

Si Wrangler sube la carpeta del repo (`src/`, `index.html` crudo) en lugar de `dist/`, el navegador recibe Vue sin compilar y la página queda en blanco.

La fuente de verdad es:

1. `npm run build` → genera `dist/`
2. `wrangler deploy` → publica solo `dist/` (ver `wrangler.jsonc`)

## Archivos clave

- `wrangler.jsonc` — `assets.directory = ./dist` + `not_found_handling = single-page-application` (fallback SPA; no uses `public/_redirects` con `/* → /index.html`, Cloudflare lo rechaza como loop)
- Variable de build: `VITE_API_URL` (opcional en local; en prod = URL del API con `/api`)

## Workers Builds (dashboard / CI)

En el Worker **entrenadorfit**, configura:

| Campo | Valor |
|--------|--------|
| Root directory | `appEntrenador` (si el repo git es el padre) o `.` si el repo es esta carpeta |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node | 22 (o 20+) |

Variable de entorno de **build** (no runtime del Worker):

- `VITE_API_URL` = URL pública del backend, ej. `https://tu-api.ejemplo.com/api`

Sin backend desplegado, el UI carga pero login/API fallarán (esperado).

## Local

```bash
npm install
npm run build
npx wrangler deploy
# o
npm run deploy
```

URL de ejemplo: `https://entrenadorfit.<cuenta>.workers.dev`
