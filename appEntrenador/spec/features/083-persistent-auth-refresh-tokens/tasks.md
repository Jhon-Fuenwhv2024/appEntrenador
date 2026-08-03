# 083 · Tasks

- [x] T1 · Spec / plan / tasks + borrador ADR-0007
- [x] T2 · Migración `034_refresh_tokens` + ensure + `script_db` / arranque server
- [x] T3 · Env: `JWT_EXPIRES_IN` default `15m`, `REFRESH_TOKEN_EXPIRES_IN=30d` (local test: `2m`)
- [x] T4 · Auth service: emitir / rotar / revocar refresh; login actualizado
- [x] T5 · Endpoints `POST /auth/refresh` y `POST /auth/logout` (Route → Controller → Service)
- [x] T6 · FE `session.js`: persistir refresh; clear en logout
- [x] T7 · FE `http.js`: single-flight refresh en 401 + exclusiones rutas públicas
- [x] T8 · Logout UI llama API logout antes de clear local
- [x] T9 · Docs `api.md` + `data-flows.md` + ADR-0007 final
- [x] T10 · Validar: build FE + smoke refresh/rotación/logout (`backend/scripts/smokeRefreshAuth.js`)
