# 086 · Resiliencia en segundo plano (PWA)

**Estado:** implementado  
**Depende de:** 051 (PWA + push), 028/059 (timer descanso), 012 (persistencia sesión), 083 (refresh tokens)  
**Skills:** `vue-best-practices`, `auth-roles-security` (push/sesión), `express-mysql-backend` (solo si hace falta API)

## Qué hace

Hace que Trainfit se comporte bien cuando el usuario **minimiza**, **bloquea** o **pierde red** en móvil/PWA. Tres pilares en una sola feature:

1. **Workout en background** — Wake Lock de pantalla durante el entreno + aviso local al terminar el descanso si la app está oculta.
2. **Hardening push/PWA** — re-bind de suscripción al volver a visible, salud del SW y deep-link fiable al tocar la notificación.
3. **Cola offline de sesión** — si al terminar el workout no hay red, guardar el payload en IndexedDB y sincronizar al volver online (sin perder series).

## Problema

- El timer ya usa wall-clock (ADR-0002 rest), pero el SO puede apagar la pantalla y el beep no suena mientras la app está suspendida.
- Push (051) funciona, pero tras días en background o cambio de usuario la suscripción puede quedar stale; iOS exige PWA instalada.
- `persistSession` falla en silencio útil si no hay red: el alumno pierde el registro del entreno.

## Criterios de aceptación

### A · Workout background

- [x] Durante `working` / `resting`, pedir **Screen Wake Lock** (si el navegador lo soporta); liberar en `finished` / unmount / idle.
- [x] Re-adquirir Wake Lock al volver a `visibilityState === 'visible'` si la sesión sigue activa.
- [x] Si el descanso termina con `document.hidden` y hay permiso de notificaciones, mostrar **notificación local** “Descanso terminado” (vía SW o `Notification`).
- [x] Mantener wall-clock + beep al volver (sin romper ADR-0002 rest).
- [x] Sin Wake Lock disponible: degradación silenciosa (no romper el player).

### B · Hardening push/PWA

- [x] Al pasar a `visible`, re-ejecutar `bindSubscriptionToCurrentUser` (soft) si hay sesión.
- [x] `notificationclick` abre/enfoca la app en `actionUrl` (incl. caso sin `client.navigate`).
- [x] Copy iOS en opt-in sigue claro (standalone vs Safari); no exigir cambios de diseño global.
- [x] Documentar límites iOS (pantalla bloqueada / no instalada).

### C · Cola offline de sesión

- [x] Si `POST /me/workout-sessions` falla por red/`navigator.onLine === false`, encolar payload en IndexedDB.
- [x] UI: mensaje “Entrenamiento guardado en el dispositivo; se subirá al recuperar red” + estado pendiente.
- [x] Al evento `online` y al montar shell autenticado (cliente), flush de la cola.
- [x] Dedup best-effort: no crear dos sesiones si el mismo `started_at` + `routine_id` ya existe hoy (check local + GET si hace falta).
- [x] Membership soft-lock / 403 de negocio **no** se encolan (mostrar error como hoy).

### Docs / validación

- [x] ADR breve + `docs/data-flows.md` (+ api si hay contrato nuevo).
- [x] Build FE OK; smoke manual checklist en tasks.

## Fuera de alcance

- App nativa / FCM SDK.
- Background Sync API completa / Periodic Sync (soporte pobre en iOS).
- Offline de dieta, chat o catálogo entero.
- Preferencias por tipo de push.
- Cambiar TTL de refresh tokens (083).

## Notas de producto

- Wake Lock = “pantalla no se apaga en el gym” (caso principal).
- Notificación local de descanso = complemento cuando el usuario minimiza con permiso push ya concedido.
- Cola offline = no perder el cierre de sesión; no es editor offline de series en vivo.
