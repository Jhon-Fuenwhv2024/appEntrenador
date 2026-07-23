# 065 · Vencimiento efectivo del plan SaaS del trainer

**Estado:** implementado  
**Depende de:** 037 (SaaS B2B SuperAdmin / FREE·PRO / `saas_expiration_date`)  
**Alimenta:** límites de invites, paywall FREE, panel `/backoffice`
## Qué hace

Hace que la fecha `saas_expiration_date` tenga efecto real: un trainer con `saas_plan = PRO` cuya fecha de vencimiento sea **anterior a hoy** se trata como **FREE efectivo** (soft-expiry en runtime). El SuperAdmin ve el estado vencido en el backoffice; el trainer ve un banner y deja de gozar de beneficios PRO hasta renovar.

Hoy (gap 037): la fecha se guarda y edita, pero `checkTrainerLimits` solo lee `saas_plan` e ignora la fecha → PRO sigue ilimitado tras vencer.

## Criterios de aceptación

### Plan efectivo (runtime)

- [ ] Si `saas_plan === 'PRO'` y `saas_expiration_date` (DATE) es **&lt; hoy** (fecha local/servidor consistente en YYYY-MM-DD) → `effective_plan = 'FREE'` y `is_expired = true`.
- [ ] Si `saas_expiration_date` es `NULL` → PRO no caduca (`is_expired = false`).
- [ ] Si `saas_plan === 'FREE'` → `effective_plan = 'FREE'` (fecha irrelevante para límites).
- [ ] **No** reescribir automáticamente `saas_plan` a FREE en DB (sin cron / sin mutación al leer).

### Backend

- [ ] `checkTrainerLimits` usa plan efectivo (no solo `saas_plan`).
- [ ] Al aplicar límite FREE por vencimiento, respuesta 402 `LIMIT_EXCEEDED` con mensaje claro de plan vencido (además o en lugar del mensaje genérico FREE).
- [ ] Account / perfil trainer expone `saas_plan`, `saas_expiration_date`, `effective_plan` y/o `is_expired` para la UI.
- [ ] Listado SaaS (`GET /saas/trainers`) puede incluir `is_expired` (o el FE lo calcula de forma equivalente con la fecha).

### Frontend — SuperAdmin (`/backoffice`)

- [ ] Chip/badge visible cuando el plan está vencido (p. ej. `PRO` + `Vencido`, o `PRO · Vencido`) con color error/warning.
- [ ] Columna Vencimiento: fecha en énfasis error y/o texto relativo (“Venció ayer”, “Venció hace N días”).
- [ ] Botón de acción: **Renovar Plan** (estilo urgente) si vencido; **Actualizar Plan** si no.
- [ ] Dialog existente de actualizar plan FREE/PRO + fecha sigue funcionando (renovar = poner fecha futura o limpiar).

### Frontend — Trainer

- [ ] `isProPlan` / badge PRO se basa en plan **efectivo** (vencido → no PRO).
- [ ] Banner tonal de error cuando `is_expired`: mensaje del tipo “Tu plan PRO venció el … — contacta soporte”.
- [ ] Paywall existente ante 402 sigue funcionando (ahora también por vencimiento).

### UX / accesibilidad

- [ ] Contraste ADR-0001 / tokens; estados no solo por color (badge + texto).
- [ ] Targets táctiles razonables en botones del backoffice.

## Fuera de alcance

- Pagos automáticos (Stripe / MercadoPago).
- Cron o job que mute `saas_plan` a FREE en DB.
- Hard-lock de login / bloquear dashboard completo.
- Suspender o soft-delete de cuentas.
- Membresía de alumnos (040) — dominio distinto.
