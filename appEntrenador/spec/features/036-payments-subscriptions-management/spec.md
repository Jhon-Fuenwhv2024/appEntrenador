# 036 · Gestión de Pagos / Control de Suscripciones (Manual)

> **Estado:** supersedida / evolucionada por **[040 · Membresía y Control de Pago del Alumno](../040-client-membership-payments/spec.md)** (incluye `days_remaining` visibles al cliente). No implementar desde esta carpeta; usar 040 como fuente de verdad.

## Objetivo
El entrenador puede marcar si el cliente "Pagó este mes" o "Debe el mes", con fechas de corte. Si el cliente no ha pagado, el sistema puede bloquear su acceso a las rutinas temporalmente.

## Requisitos
- Tabla `subscriptions` o campos en `users`/`clients` para estado de pago y fecha de corte.
- UI Entrenador: Panel de gestión financiera por cliente.
- UI Cliente: Aviso de pago pendiente / Bloqueo de acceso.

> El motor SaaS B2B / SuperAdmin de plataforma vive en la feature **037** (`037-saas-b2b-superadmin`), no en esta.
