# 083 · Sesión persistente (access + refresh tokens)

**Estado:** implementado  
**Depende de:** 001 (auth modular), 003 (JWT + middleware), 056 (reset password — patrón hash opaco)  
**Skills:** `auth-roles-security`, `express-mysql-backend`, `vue-best-practices`

## Qué hace

Evita que clientes y trainers tengan que iniciar sesión cada día solo porque el JWT de acceso venció. Introduce el patrón **access token corto + refresh token largo y revocable**: la sesión se renueva en silencio mientras el usuario no cierre sesión (o el refresh no expire / no se revoque).

## Problema actual

- Login emite un único JWT (`JWT_EXPIRES_IN`, hoy `8h`) guardado en `localStorage`.
- Al vencer, cualquier `401` en el interceptor de Axios limpia la sesión y redirige al login.
- No hay forma de renovar sin volver a pedir usuario/contraseña ni de invalidar sesión en servidor al hacer logout.

## Criterios de aceptación

### Producto / UX

- [x] Un usuario autenticado que **no** cierre sesión permanece usable **≥ 30 días** de actividad (ventana deslizante al refrescar).
- [x] Tras **Cerrar sesión** (menú de cuenta / shell), la sesión queda invalidada: no se puede renovar con el refresh anterior.
- [x] Si el refresh está vencido, revocado o es inválido → login obligatorio (mismo flujo que hoy).
- [x] Aplica a roles `trainer` y `client` (y superadmin vía claim existente).
- [x] SSE (`?token=`) y media privada siguen usando el **access** JWT vigente (tras refresh silencioso si hace falta).

### Base de datos

- [x] Tabla `refresh_tokens` con: `id`, `user_id`, `token_hash` (SHA-256), `expires_at`, `revoked_at` nullable, `replaced_by_id` nullable (rotación), `user_agent` nullable, `created_at`, `last_used_at`.
- [x] Migración `034_*` + `script_db.sql` / ensure al arranque.
- [x] Índice por `token_hash` UNIQUE; índice por `user_id` + `revoked_at`.

### Backend

- [x] Access JWT corto vía env (`JWT_EXPIRES_IN`, default recomendado `15m`).
- [x] Refresh TTL vía env (`REFRESH_TOKEN_EXPIRES_IN`, default `30d`).
- [x] `POST /login` emite `{ user, token, refreshToken }` (refresh opaco; **nunca** en logs).
- [x] `POST /auth/refresh` (público con refresh válido) → nuevo access + nuevo refresh (rotación); invalida el refresh usado.
- [x] Detección de reuso: si se presenta un refresh ya rotado/revocado → revocar familia/sesión de ese usuario y responder `401`.
- [x] `POST /auth/logout` (Bearer opcional + body refresh) → revoca refresh(es) del usuario.
- [x] Refresh almacenado solo como hash (mismo patrón que reset password Feature 056).
- [x] Route → Controller → Service; prepared statements; respuestas `{ success, data|error, code }`.

### Frontend

- [x] Persistir refresh en `localStorage` + access en sesión actual (Fase A).
- [x] Interceptor Axios: ante `401` en request autenticado, **un solo** intento de refresh (cola single-flight); reintentar la request; si falla → clear + redirect login.
- [x] Logout llama a `POST /auth/logout` y luego limpia storage local.
- [x] No tratar `POST /auth/refresh` ni rutas públicas de auth como “401 → wipe + hard redirect” en bucle.

### Docs / seguridad

- [x] `docs/api.md` + `docs/data-flows.md` actualizados.
- [x] ADR `docs/decisions/ADR-0007-persistent-auth-refresh-tokens.md`.

## Fuera de alcance

- BFF completo (tokens solo en servidor / Redis session store).
- OAuth / proveedores externos.
- “Remember me” como checkbox separado (MVP: siempre sesión larga hasta logout o TTL).
- Lista de dispositivos activos en UI.
- Cookie HttpOnly (Fase B) — documentada en ADR/plan.
