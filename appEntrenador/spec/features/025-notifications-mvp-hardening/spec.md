# 025 · Notificaciones MVP + hardening config/deploy

**Estado:** pendiente

**Depende de:** dashboard 015; recomendable tras 017/012

## Qué hace

1. **Notificaciones in-app MVP:** badge real en header (deja de estar disabled) con eventos mínimos del dominio del trainer: alumno nuevo, sesión completada, alumno sin plan.
2. **Hardening:** credenciales DB/JWT solo por `.env`; checklist de despliegue (frontend + API) documentado en `docs/`.

## Criterios de aceptación

### Notificaciones

- [ ] Fuente de verdad server-side (tabla ligera `notifications` o cálculo derivado documentado)
- [ ] `GET` notificaciones del trainer; marcar leídas
- [ ] Badge en header refleja no leídas; panel/lista simple
- [ ] Eventos mínimos generados en flujos existentes (register cliente, finish session, o job/consulta de “sin plan”)
- [ ] Ownership por trainer

### Hardening / deploy

- [ ] `db.js` sin credenciales hardcodeadas; `.env.example` completo
- [ ] Doc en `docs/` con variables, build frontend, arranque API, notas Netlify/hosting API
- [ ] Sin secretos en repo

- [ ] Docs api / architecture
- [ ] Build OK

## Fuera de alcance

- Push mobile / email
- Dietas
- Suite de tests automatizados (backlog posterior)
- Pinia / TypeScript
