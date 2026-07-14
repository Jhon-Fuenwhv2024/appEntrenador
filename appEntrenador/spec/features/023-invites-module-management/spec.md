# 023 · Invitaciones: módulo + gestión

**Estado:** pendiente

**Depende de:** auth/invites actuales; se beneficia de 017

## Qué hace

Extrae invitaciones de `modules/auth` a `modules/invites` y añade gestión operativa: listar tokens (pendientes/usados), revocar o invalidar, regenerar link. La generación sigue siendo una **acción** desde Inicio/Alumnos, no un ítem de la barra.

## Criterios de aceptación

- [ ] Código de invites en `backend/src/modules/invites/` (routes → controller → service)
- [ ] `POST` generar token (comportamiento actual preservado o mejorado)
- [ ] `GET` listado de invitaciones del trainer autenticado (estado usado/pendiente)
- [ ] Revocar/invalidar invitación pendiente
- [ ] UI: panel o sección “Invitaciones” desde hub o alumnos (sin slot nav nuevo)
- [ ] Ownership por `trainer_id` = `req.user.id`
- [ ] Docs api / architecture / data-flows
- [ ] Build + smoke login/registro por token

## Fuera de alcance

- Caducidad temporal automática (opcional si cabe sin scope creep)
- Invitaciones por email SMTP
- Multi-trainer marketplace
