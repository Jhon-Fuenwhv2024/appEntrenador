# 048 · PWA + notificaciones push

**Estado:** pendiente (SDD)
**Depende de:** 025 (notifs in-app), 046 (HTTPS prod)
**Prioridad backlog:** ver `spec/constitution/roadmap.md` (043–052)

## Qué hace

Retención móvil; hoy solo notificaciones in-app.

## Criterios de aceptación

### Base de datos / infraestructura

- [ ] Tabla push_subscriptions: user_id, endpoint, keys, created_at

### Backend

- [ ] POST /me/push-subscriptions + DELETE
- [ ] Envío Web Push (VAPID) al crear notifs críticas (rutina asignada, PR, racha en riesgo)

### UI

- [ ] manifest + service worker (Vite PWA)
- [ ] Prompt permiso notificaciones en cliente
- [ ] Iconos/splash mínimos

## Fuera de alcance

- App Store nativa
- Rich push con acciones complejas
