# ADR-0009 · Resiliencia en segundo plano (PWA)

**Estado:** aceptada  
**Feature:** [086-background-resilience](../../spec/features/086-background-resilience/spec.md)  
**Relacionados:** [ADR-0002 rest timer](ADR-0002-rest-timer-background.md), [ADR-0006 PWA push](ADR-0006-pwa-web-push.md)

## Contexto

Trainfit ya era PWA con push (051) y el descanso usaba wall-clock (028/059). Aun así, en el gym la pantalla se apaga, el beep no suena con la app suspendida, la suscripción push puede quedar stale tras días en background, y un `POST` de sesión fallido por red pierde el entrenamiento.

## Decisión

1. **Screen Wake Lock** durante fases `working` / `resting` del player (`useWakeLock`); re-adquirir al volver a visible; liberar al terminar.
2. **Notificación local** al completar descanso si `document.hidden` y `Notification.permission === 'granted'` (vía SW `showNotification`, tipo `rest_complete`).
3. **Re-bind soft de push** al restaurar visibilidad (throttle 15s) sin volver a pedir permiso.
4. **`notificationclick` robusto:** focus + `navigate` si existe; si no, `postMessage({ type: 'TRAINFIT_NAVIGATE' })` y `router.push` en `main.js`.
5. **Cola IndexedDB** (`trainfit-offline` / `pending_workout_sessions`) para el payload de `POST /me/workout-sessions` cuando no hay red; flush en evento `online` y al montar AppShell / player. Dedup best-effort por `routine_id` + `started_at` (sin migración MySQL).

## Consecuencias

- Wake Lock no está en todos los navegadores (iOS Safari limitado); degradación silenciosa.
- Con pantalla **bloqueada** el SO puede suspender JS: el wall-clock + sync al volver siguen siendo la red de seguridad (ADR-0002 rest).
- Offline MVP solo cubre el **cierre de sesión**, no edición offline de series ni dietas.
- 403 de membresía no se encola.

## Alternativas rechazadas

- Background Sync / Periodic Sync como dependencia — soporte pobre en iOS.
- Columna `client_session_key` en MySQL — aplazada; dedup cliente basta para MVP.
- App nativa — fuera de misión.
