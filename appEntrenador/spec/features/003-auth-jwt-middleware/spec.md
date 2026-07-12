# 003 · Auth JWT y middleware de roles

**Estado:** implementada

## Qué hace

Login emite JWT; el frontend lo envía en `Authorization: Bearer`; Express autentica y autoriza por rol antes de endpoints sensibles.

## Criterios de aceptación

- [x] `POST /login` responde con `token` + `user`.
- [x] Middleware `authenticate` + `requireRole` en rutas protegidas.
- [x] Axios adjunta el token; 401 limpia sesión.
- [x] `/generate-token` y `/clients` exigen trainer autenticado.
