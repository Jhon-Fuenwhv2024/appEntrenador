# 044 · Caducidad y envío de invitaciones por email

**Estado:** pendiente (SDD)
**Depende de:** 023 (invites), 043 (SMTP)
**Prioridad backlog:** ver `spec/constitution/roadmap.md` (043–052)

## Qué hace

Operativa real del trainer: hoy solo copiar link; invitaciones sin caducidad clara ni email.

## Criterios de aceptación

### Base de datos / infraestructura

- [ ] Columnas en invitaciones: expires_at, emailed_at, email_to nullable (si no existen)
- [ ] Migración + ensure

### Backend

- [ ] Al crear invite: expires_at por defecto (ej. 7 días) configurable
- [ ] POST /invites/:id/send-email — envía link vía SMTP
- [ ] Rechazar registro si token expirado o revocado
- [ ] Listado invites muestra estado: pending / used / revoked / expired

### UI

- [ ] UI trainer: botón Enviar email + fecha de caducidad
- [ ] Badge Expired en gestión de invitaciones

## Fuera de alcance

- Plantillas HTML marketing complejas
- Cola de jobs externa (puede ser sync MVP)
