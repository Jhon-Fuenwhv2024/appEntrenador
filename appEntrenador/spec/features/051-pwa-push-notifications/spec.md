# 051 · PWA + notificaciones push

**Estado:** implementado  
**Depende de:** 025 (notificaciones in-app), 074 (deep-links / `action_url`), 034 (mensajería)  
**Relacionada:** roadmap backlog 051

## Qué hace

Convierte Trainfit en **PWA instalable** y envía **notificaciones push del sistema** cuando el usuario no tiene la app abierta: fan-out desde `createNotification` y push de chat sin spam in-app.

## Decisiones de producto

- **PWA:** `vite-plugin-pwa` + Workbox; manifest Trainfit; `display: standalone`.
- **Push:** Web Push + VAPID (`web-push` en Express). Subscriptions en tabla `push_subscriptions` por dispositivo (`endpoint` UNIQUE).
- **Fan-out:** cada `createNotification` exitoso intenta push (fire-and-forget; fallo de push no rompe in-app).
- **Chat:** al persistir DM, push al receptor con deep-link a mensajes; **sin** crear fila in-app `new_message`.
- **Opt-in:** permiso del navegador + toggle en perfil cliente / ajustes trainer + soft-prompt post-login (dismissible).
- **Deep-link:** payload usa `action_url` relativo (misma regla que 074: solo paths `/…`).
- **Endpoints muertos:** borrar subscription si push responde 404/410.

## Criterios de aceptación

### Base de datos

- [x] Tabla `push_subscriptions` (`user_id`, `endpoint` UNIQUE, `p256dh`, `auth`, `user_agent`, timestamps)
- [x] Migración + `ensure` al arranque + `script_db.sql` + docs schema

### Backend

- [x] Env `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (sin hardcode)
- [x] `GET /api/push/vapid-public-key` (auth trainer|client)
- [x] `POST /api/push/subscriptions` upsert ownership `req.user.id`
- [x] `DELETE /api/push/subscriptions` por endpoint del body
- [x] `sendPushToUser` + hook en `createNotification` + hook en `sendMessage`
- [x] Script one-shot para generar VAPID (documentado)

### Frontend

- [x] Manifest + SW (push + notificationclick)
- [x] Composable `usePushNotifications` + API client
- [x] Toggle en `/client/profile` y `/trainer/settings`
- [x] Soft-prompt no agresivo tras sesión autenticada
- [x] Contraste / focus / `aria-label` (reglas UI Trainfit)

### Docs / validación

- [x] `docs/api.md`, `docs/data-flows.md`, `docs/database-schema.md`, deploy + ADR
- [x] Build FE OK; backend módulo + ensure tabla OK; smoke VAPID documentado (`npm run vapid:generate`)

## Fuera de alcance

- Recordatorios programados / cron
- Preferencias por tipo de notificación
- Email push / Stripe / app nativa
- Features 047, 053, 055
