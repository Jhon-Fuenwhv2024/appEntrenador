# 065 · Plan — Vencimiento efectivo del plan SaaS del trainer

## Enfoque

1. Extraer helper compartido de plan efectivo (`effectiveSaasPlan(saas_plan, saas_expiration_date, today)`) usable desde middleware y services.
2. Actualizar `checkTrainerLimits` para consultar `saas_plan` + `saas_expiration_date` y aplicar límites FREE si vencido.
3. Extender account (y opcionalmente listado SaaS) con `effective_plan` / `is_expired` + fecha.
4. UI SuperAdmin: estados vencidos en tabla + CTA Renovar.
5. UI trainer: badge/banner según plan efectivo.
6. Docs API si cambia el contrato de account/saas; validar build + smoke invites con PRO vencido.

## Decisiones

- Soft-expiry en **runtime**; la fila DB puede seguir mostrando `PRO` + fecha pasada (auditoría / renovación fácil).
- Comparación por fecha calendario `YYYY-MM-DD` (sin hora).
- `NULL` en vencimiento = PRO sin caducidad.
- Mensaje 402 distingue “plan gratuito” vs “plan PRO vencido” cuando aplique.
- Reutilizar patrón visual de banner de membresía cliente (040), adaptado a SaaS trainer.

## Archivos clave

- BE: `backend/src/middleware/checkTrainerLimits.js`, `backend/src/modules/account/account.service.js`, `backend/src/modules/saas/saas.service.js` (+ helper util si aplica)
- FE: `src/features/saas/SuperAdminDashboardView.vue`, composable/session account (`isProPlan`), menú cuenta / banner trainer
- Docs: `docs/api.md` (si el contrato account/saas cambia)
