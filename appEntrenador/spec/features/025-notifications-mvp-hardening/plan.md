# 025 · Plan

## Enfoque notificaciones

1. Decidir: tabla `notifications` (recomendado para leídas) vs solo contadores derivados.
2. Módulo `notifications` o endpoints bajo trainer; crear filas en register / finish workout / cron ligero opcional.
3. UI: habilitar botón campana; menú/panel con lista y mark-as-read.

## Enfoque hardening

1. Auditar `backend/src/config/db.js` y cualquier secret en código.
2. Alinear `.env.example`; documentar `VITE_API_URL`, `JWT_*`, DB_*.
3. `docs/deploy.md` (o sección en architecture): build, env, CORS, no commitear `.env`.

## Seguridad

- Skill auth-roles; no endpoints abiertos “porque es local”.
