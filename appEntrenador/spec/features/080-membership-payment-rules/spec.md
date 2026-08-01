# 080 · Reglas de dominio membresía (pago ↔ estado)

**Estado:** implementada  
**Depende de:** 040 (membresía alumno), 079 (tipos / plan_price / amount_paid)  
**Distinto de:** pasarela de pago, créditos por sobrepago, historial de abonos

## Qué hace

Garantiza consistencia entre `plan_price`, `amount_paid` y `status` en el upsert de membresía: el trainer no puede dejar estados imposibles (pagado completo en Pendiente, sobrepago, Al día con deuda).

## Decisiones de producto

Con `plan_price` definido:

1. **Sobrepago:** rechazar si `amount_paid > plan_price` (HTTP 400).
2. **Pago completo:** si `amount_paid >= plan_price` y periodo no vencido → forzar `status = active`.
3. **Pago parcial / cero:** si `amount_paid < plan_price` y periodo no vencido → forzar `status = owing`.
4. **Vencido por fecha:** si `period_end < hoy` → `status = expired` (prioridad sobre pago).
5. **Sin `plan_price`:** estado manual (flujo 040); solo validar montos ≥ 0.
6. **`amount_paid` persistible** en cualquier status (`active` / `owing` / `expired`).
7. **Soft-lock:** `block_on_unpaid` solo bloquea tras `period_end` + **3 días de gracia** (no por `owing`).
8. **Auto-expired al leer:** si `period_end < hoy` → persistir `expired`.

## Criterios de aceptación

### Backend

- [x] Helper `applyMembershipPaymentRules` en service de memberships
- [x] PUT upsert aplica las 6 reglas antes de persistir
- [x] Error 400 claro en español si hay sobrepago
- [x] Soft-lock solo post-gracia (no por owing)
- [x] Auto-expired al leer

### Frontend

- [x] `MembershipPanel`: tope de `amount_paid` vs precio del tipo
- [x] Auto-chip Al día / Pendiente según monto
- [x] Enviar `amount_paid` también en `active` / `expired`
- [x] Toggle/label de bloqueo aclara gracia; UI cliente no bloquea por owing

### Docs

- [x] `docs/api.md` y `docs/data-flows.md` documentan reglas y errores
- [x] ADR-0003
- [x] ADR-0004 (gracia / soft-lock)
## Fuera de alcance

- Pasarela Stripe/MercadoPago
- Crédito por sobrepago
- Historial de abonos múltiples
- Dunning / emails automáticos
- Cambios de schema MySQL
