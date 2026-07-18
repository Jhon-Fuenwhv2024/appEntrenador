# 045 · Cambio de Contraseña (Modo Cliente)

**Estado:** pendiente (SDD listo — Epic Fitness Fase 4)
**Depende de:** 024 (ajustes de cuenta / API password), componente compartido `ChangePasswordForm`
**Relacionada:** backlog forgot-password + SMTP (046)

## Qué hace

Replica en el **portal cliente** la misma UX de cambio de contraseña que ya tiene el entrenador: clave actual, nueva clave y confirmación, usando el endpoint compartido `/api/me/password`.

## Criterios de aceptación

### Backend

- [ ] Confirmar que `POST /api/me/password` acepta rol `client` (`requireRole('trainer', 'client')`).
- [ ] Sin cambios de contrato si ya funciona; solo hardening/docs si falta algo.
- [ ] Validación: password actual correcta (bcrypt), nueva distinta/longitud mínima según 024.
- [ ] Operación solo sobre `req.user.id` (nunca IDs ajenos).

### Frontend

- [ ] Montar `ChangePasswordForm` (o equivalente) en `ClientProfileView` (`/client/profile`).
- [ ] Misma semántica que trainer: actual + nueva + confirmación; errores visibles vía notificaciones/interceptor.
- [ ] Usar `changeMyPassword` de `shared/api/accountApi.js`.
- [ ] Contraste Trainfit: CTA primary legible (`on-primary`).

### Validación

- [ ] Smoke: cliente autenticado cambia password y puede re-login.
- [ ] Trainer settings no se rompe.

## Fuera de alcance

- Forgot-password / reset por email / SMTP (feature **046**)
- Cambio de username/email
- 2FA / cerrar otras sesiones
- Forzar re-login inmediato tras cambio (JWT actual puede seguir válido como en 024, salvo decisión contraria documentada)
