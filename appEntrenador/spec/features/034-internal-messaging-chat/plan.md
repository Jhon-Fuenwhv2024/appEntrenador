# Plan 034

1. Crear tabla `messages` en `script_db.sql` + migración `017_messages.sql`.
2. Backend: módulo `messages` (REST + SSE in-memory). Sin Socket.io.
3. Frontend: `ChatThread` + `TrainerInboxView` / `ClientChatView` con `EventSource`.
4. Optimización: `v-memo` en burbujas de la lista.
5. Integrar con notificaciones in-app (Feature 025) — pendiente / fuera de este MVP.