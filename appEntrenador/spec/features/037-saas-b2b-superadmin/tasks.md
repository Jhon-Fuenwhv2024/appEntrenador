# 037 · Tasks

- [x] Crear SDD (spec / plan / tasks)
- [x] DDL: `is_superadmin` en `usuarios`; `saas_plan` / `saas_expiration_date` en `trainers_info` (migración 018 + `script_db.sql`)
- [x] Backend: JWT/`req.user.is_superadmin`; middlewares `requireSuperAdmin` + `checkTrainerLimits`; módulo `/api/saas`; gate en `POST /invites`
- [x] Frontend: sesión `is_superadmin`; panel `/backoffice`; ítem nav Panel SaaS; paywall 402 en create-invite
- [x] Docs API / architecture / schema
- [ ] Pagos automatizados / portal facturación (fuera de alcance Fase 1)
- [x] Validar build + arranque backend (`ensureSaasColumns`; `/api/saas` responde 401 sin token)
- [ ] (Manual dueño) `UPDATE usuarios SET is_superadmin = TRUE WHERE id = <TU_ID>` + re-login
