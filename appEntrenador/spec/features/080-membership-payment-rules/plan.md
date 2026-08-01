# 080 · Plan

## Enfoque

1. Reglas de dominio en **Service** (`memberships.service.js`), no en routes/controller.
2. Espejo UX en `MembershipPanel.vue` (validación inmediata + auto-estado).
3. Documentar contrato en `docs/api.md` y flujo en `docs/data-flows.md`.

## Orden de trabajo

1. Spec / tasks (este feature)
2. Backend: `applyMembershipPaymentRules` + integrar en `normalizeUpsertPayload` / `upsertForTrainer`
3. Frontend: validación, auto-status, payload completo
4. Docs + build / smoke
