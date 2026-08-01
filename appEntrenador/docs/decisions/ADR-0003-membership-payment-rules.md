# ADR-0003 · Reglas de dominio membresía (pago ↔ estado)

**Estado:** aceptada  
**Fecha:** 2026-08-01  
**Feature:** 080

## Contexto

Con tipos de membresía (079) el trainer puede registrar `plan_price` y `amount_paid`, pero el `status` (`active` / `owing` / `expired`) era independiente. Eso permitía estados imposibles: Pendiente con pago completo, Al día con deuda, o sobrepago.

## Decisión

Cuando hay `plan_price`, el service deriva el status:

1. Rechazar `amount_paid > plan_price` (400).
2. Si `period_end < hoy` → `expired`.
3. Si pagó completo → `active`.
4. Si hay saldo → `owing`.

Sin `plan_price`, el status sigue siendo manual (040), con auto-expiración de `active`.

## Consecuencias

- La UI puede sugerir el chip, pero el backend es la fuente de verdad.
- No hay crédito por sobrepago en esta versión.
- No requiere cambio de schema.
