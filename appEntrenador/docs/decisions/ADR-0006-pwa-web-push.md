# ADR-0006 · PWA + Web Push (VAPID)

## Contexto

Trainfit solo tenía notificaciones **in-app** (campana). En móvil eso no retiene: si el alumno no abre la SPA, no ve rutinas nuevas, dietas ni mensajes.

## Decisión

1. **PWA** con `vite-plugin-pwa` (estrategia `injectManifest`) y service worker en `src/sw.js` (precache Workbox + handlers `push` / `notificationclick`).
2. **Web Push** desde Express con `web-push` y claves **VAPID** en env (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
3. Tabla `push_subscriptions` por dispositivo (`endpoint` UNIQUE), ownership `user_id = req.user.id`.
4. **Fan-out** desde `createNotification` (in-app + push) y desde `sendMessage` (solo push, sin spam de campana).
5. Deep-links reutilizan paths relativos seguros de Feature 074.

## Consecuencias

- Front (Cloudflare) y API (Render) pueden vivir en orígenes distintos: el SW se registra en el origen de la SPA; el envío push lo hace el API.
- Sin VAPID configurado, push queda deshabilitado de forma segura (503 en clave pública; envíos omitidos).
- iOS: mejor esfuerzo (PWA en pantalla de inicio); MVP prioriza Chrome/Android.
- No hay preferencias por tipo ni recordatorios cron en este ADR (fuera de 051 MVP).

## Alternativas rechazadas

- App nativa / FCM SDK dedicado — fuera de misión web.
- Email por cada evento — ya hay SMTP para reset; push es el canal de retención inmediata.
- Servir el SW desde el API — rompería installability del origen Cloudflare.
