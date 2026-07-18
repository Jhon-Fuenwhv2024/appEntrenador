# 043 · Recuperación de contraseña + email SMTP + password en perfil cliente

**Estado:** pendiente (SDD)
**Depende de:** 003 (JWT), 024 (cuenta/password trainer)
**Prioridad backlog:** ver `spec/constitution/roadmap.md` (043–052)

## Qué hace

Hoy el cliente no cambia password en UI; no hay forgot-password; sin SMTP el soporte se rompe.

## Criterios de aceptación

### Base de datos / infraestructura

- [ ] Tabla password_reset_tokens: id, user_id FK, token hash UNIQUE, expires_at, used_at nullable, created_at
- [ ] Índice por token y por user_id
- [ ] Migración + ensure + script_db.sql

### Backend

- [ ] POST /auth/forgot-password (email/username) — siempre 200 genérico; genera token + envía email si existe usuario
- [ ] POST /auth/reset-password { token, new_password }
- [ ] POST /me/password disponible también para rol client
- [ ] Servicio SMTP configurable por env (HOST, PORT, USER, PASS, FROM) — sin secretos en código

### UI

- [ ] Pantallas /forgot-password y /reset-password
- [ ] Perfil cliente: sección cambiar contraseña
- [ ] Copy de éxito genérico (no revelar si el email existe)

## Fuera de alcance

- OAuth social login
- Magic links permanentes
- 2FA
