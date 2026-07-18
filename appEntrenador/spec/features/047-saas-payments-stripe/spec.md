# 047 · Pagos SaaS automatizados (037 Fase 2)

**Estado:** pendiente (SDD)
**Depende de:** 037 (FREE/PRO SuperAdmin)
**Prioridad backlog:** ver `spec/constitution/roadmap.md` (043–052)

## Qué hace

FREE/PRO hoy es manual vía SuperAdmin; hace falta Stripe/pasarela + portal facturación.

## Criterios de aceptación

### Base de datos / infraestructura

- [ ] Columnas o tabla billing: stripe_customer_id, stripe_subscription_id, plan_status, current_period_end

### Backend

- [ ] Checkout / Customer Portal Stripe
- [ ] Webhooks: invoice.paid, customer.subscription.updated/deleted → actualiza saas_plan
- [ ] No hardcodear secretos; Stripe keys en env

### UI

- [ ] Página pricing / upgrade en Ajustes trainer
- [ ] Backoffice sigue pudiendo override manual (superadmin)

## Fuera de alcance

- Facturación fiscal completa / ERP
- Multi-pasarela
