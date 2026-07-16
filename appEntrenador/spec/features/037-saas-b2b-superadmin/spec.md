# 037 · Motor SaaS B2B y Panel SuperAdmin (Gestión Manual)

**Estado:** en progreso (Fase 1 implementada: schema, middlewares, `/api/saas`, panel SuperAdmin, paywall FREE)
**Depende de:** 003 (Auth JWT / roles), 023 (Invites), 024 (Account / trainers_info)

## Qué hace

Implementa la arquitectura base para el modelo de negocio B2B. Introduce el flag oculto de SuperAdmin (dueño de plataforma) y un motor de límites que restringe a los entrenadores en plan `FREE` a un máximo de slots (alumnos + invitaciones pendientes). Provee un panel Backoffice para gestionar manualmente las suscripciones de los entrenadores.

> Nota: SuperAdmin **no** es un tercer valor de `rol`. Es `usuarios.is_superadmin` sobre el modelo existente `trainer` | `client`.

## Criterios de aceptación (Fase 1)

- [x] **Base de datos:** `usuarios.is_superadmin`; `trainers_info.saas_plan` (`FREE`|`PRO`); `trainers_info.saas_expiration_date`.
- [x] **Middleware `requireSuperAdmin`:** 403 en `/api/saas/*` si no es superadmin.
- [x] **Middleware `checkTrainerLimits`:** en `POST /api/invites`, si plan FREE y slots >= 3 → 402 `LIMIT_EXCEEDED`.
- [x] **UI Backoffice `/backoffice`:** solo si `is_superadmin === true`; lista trainers; actualizar plan + fecha.
- [x] **UI Paywall:** al crear invite con 402, modal con mensaje de límite FREE → contactar soporte PRO.

## Fuera de alcance (Fase 1)

- Pagos automatizados (Stripe / MercadoPago).
- Portales de facturación para el entrenador.
- Suspender / soft-delete de cuentas.
