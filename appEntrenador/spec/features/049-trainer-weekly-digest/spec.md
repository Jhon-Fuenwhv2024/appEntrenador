# 049 · Informe semanal automático al trainer

**Estado:** pendiente (SDD)
**Depende de:** 042 (rachas), 040 (membresías), 043 (SMTP)
**Prioridad backlog:** ver `spec/constitution/roadmap.md` (043–052)

## Qué hace

Resumen accionable: entrenos, rachas en riesgo, membresías por vencer.

## Criterios de aceptación

### Base de datos / infraestructura

- [ ] Preferencia trainers_info.weekly_digest_enabled + last_sent_at

### Backend

- [ ] Job semanal (cron / scheduled function) que agrega KPIs por trainer
- [ ] Email HTML + opcional notif in-app digest_ready

### UI

- [ ] Toggle en Ajustes trainer
- [ ] Vista opcional del último digest en dashboard

## Fuera de alcance

- Informes diarios
- PDF adjunto (ver 052)
