# 051 · Plan técnico

## Component map (FE)

| Pieza | Responsabilidad |
|-------|-----------------|
| `usePushNotifications` | Permiso, subscribe/unsubscribe, sync API, estado |
| `PushOptInCard.vue` | Toggle + copy en perfil/ajustes |
| `PushSoftPrompt.vue` | Banner dismissible post-login |
| `src/sw.js` | Precache Workbox + `push` + `notificationclick` |
| `pushApi.js` | Cliente Axios de `/push/*` |

## Backend

```
modules/push/
  push.routes.js → push.controller.js → push.service.js
db/ensurePushSubscriptionsTable.js
db/migrations/030_push_subscriptions.sql
scripts/generateVapidKeys.js
```

## Flujo

1. FE pide permiso → `pushManager.subscribe(applicationServerKey)` → `POST /push/subscriptions`.
2. Evento de negocio → `createNotification` o chat → `sendPushToUser`.
3. SW recibe `push` → `showNotification` → click abre `action_url`.

## Deploy

- Front Cloudflare: sirve SW en origen SPA.
- API Render: env VAPID; no sirve el SW.
