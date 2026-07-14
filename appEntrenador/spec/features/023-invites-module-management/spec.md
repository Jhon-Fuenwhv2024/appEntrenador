# 023 · Invitaciones: módulo + gestión

**Estado:** hecha

**Depende de:** auth/invites actuales; se beneficia de 017

## Qué hace

Extrae invitaciones de `modules/auth` a `modules/invites` y añade gestión operativa: listar tokens (pendientes/usados), revocar o invalidar, regenerar link. La generación sigue siendo una **acción** desde Inicio/Alumnos, no un ítem de la barra.

## Criterios de aceptación

- [x] Código de invites en `backend/src/modules/invites/` (routes → controller → service)
- [x] `POST` generar token (comportamiento actual preservado o mejorado)
- [x] `GET` listado de invitaciones del trainer autenticado (estado usado/pendiente)
- [x] Revocar/invalidar invitación pendiente
- [x] UI: panel o sección “Invitaciones” desde hub o alumnos (sin slot nav nuevo)
- [x] Ownership por `trainer_id` = `req.user.id`
- [x] Docs api / architecture / data-flows
- [x] Build + smoke login/registro por token

## Fuera de alcance

- Caducidad temporal automática (opcional si cabe sin scope creep)
- Invitaciones por email SMTP
- Multi-trainer marketplace
