# ADR-0004 · Soft-lock de membresía (gracia y pendiente)

**Estado:** aceptada  
**Fecha:** 2026-08-01  
**Relacionada:** ADR-0003 (pago ↔ status), Feature 040/080

## Contexto

`block_on_unpaid` bloqueaba si `status ≠ active`, así un alumno en **Pendiente** (con o sin abono) perdía acceso aunque el periodo del plan siguiera vigente.

## Decisión

1. El soft-lock **no** depende de `owing`. Solo de calendario: periodo terminado + **3 días de gracia**.
2. Condición de bloqueo: `block_on_unpaid && days_remaining < -3`.
3. Al leer membresía, si `period_end < hoy` se persiste `status = expired` (el acceso puede seguir durante la gracia).
4. Copy del toggle trainer: “Bloquear rutinas al vencer el periodo (3 días de gracia)”.

## Consecuencias

- Pendiente + abono durante el mes → acceso OK.
- Tras vencer: 3 días de aviso/gracia, luego 403 `MEMBERSHIP_BLOCKED` si el toggle está activo.
- UI + in-app: banner de gracia y tipo `membership_grace` (job 09:00 locales, 1/día).
- Constante FE: `src/shared/membership/access.js`; BE: `MEMBERSHIP_ACCESS_GRACE_DAYS` en memberships.service / notification-jobs.