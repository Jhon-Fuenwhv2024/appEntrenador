# 037 · Plan — Motor SaaS B2B / SuperAdmin

## Enfoque

1. Flag `is_superadmin` en JWT + sesión frontend (no nuevo ENUM de rol).
2. Planes en `trainers_info` (FREE/PRO + fecha).
3. Gate en creación de invitaciones (`checkTrainerLimits`).
4. Módulo `backend/src/modules/saas` (Route → Controller → Service).
5. Vista `/backoffice` + ítem nav condicional en `AppShell`.
6. Migración automática al arranque (`ensureSaasColumns`) + script one-shot + SQL 018.

## Archivos clave

- Backend: `middleware/requireSuperAdmin.js`, `middleware/checkTrainerLimits.js`, `modules/saas/*`, `db/ensureSaasColumns.js`
- Frontend: `features/saas/*`, `shared/auth/session.js`, `router.js`, `AppShell.vue`, paywall en invites/dashboard
- Docs: `docs/api.md`, `docs/architecture.md`, `docs/database-schema.md`
