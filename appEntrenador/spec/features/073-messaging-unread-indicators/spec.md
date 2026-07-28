# 073 · Indicadores de mensajes no leídos

**Estado:** implementado  
**Depende de:** 034 (mensajería interna SSE)  
**Relacionada:** 014 (bottom nav), 063 (session header), 074 (campana — no requiere `new_message` en MVP)

## Qué hace

Hace **descubribles** los mensajes nuevos sin abrir el chat: badge en la tab Chat (cliente y entrenador), contadores/preview en el inbox del entrenador, y refresco del contador al marcar leídos. Usa la columna existente `messages.is_read`.

## Decisiones de producto

- **Fuente de verdad:** `messages.is_read` (ya se pone `TRUE` al abrir el hilo vía `GET /messages/:partnerId`).
- **Descubrimiento:** badge en bottom nav Chat + filas del inbox trainer; **no** exigir notificación de campana por cada DM en este MVP.
- **Actualización del badge:** **polling** cada 30–60s desde shell/bottom-nav (y al focus de ventana / al volver a la ruta Chat). Evita rediseñar el SSE single-process como bus global.
- Al abrir conversación: flujo mark-read actual + invalidar/refrescar summary.

## Criterios de aceptación

### Backend

- [x] `GET /api/messages/unread-summary` (auth trainer | client)
- [x] Respuesta: `{ total, byPartner: [{ partnerId, count, lastMessageAt, preview }] }`
- [x] Cliente: solo mensajes no leídos del entrenador asignado (0 o 1 partner)
- [x] Trainer: agregación por cada cliente con mensajes no leídos hacia el trainer
- [x] `preview`: recorte seguro del último mensaje no leído o del último mensaje entrante (p. ej. 80 chars)
- [x] Ownership: no filtrar por IDs del body; usar `req.user` + relación trainer–client
- [x] Route → Controller → Service

### Frontend — Badge nav

- [x] Badge numérico en tab **Chat** de [`AppBottomNav.vue`](src/shared/layout/AppBottomNav.vue) (cliente y trainer) cuando `total > 0` (`n` / `99+`)
- [x] Composable compartido p. ej. `useUnreadMessages` (fetch + poll + refresh)
- [x] Al montar chat / tras mark-read: `refresh()` del summary
- [x] `aria-label` del tab incluye contador si hay no leídos

### Frontend — Inbox trainer

- [x] Lista de clientes: contador o punto + preview + hora relativa del último mensaje relevante
- [x] Clientes sin no leídos: sin badge; orden preferente: no leídos primero, luego alfabético o por `lastMessageAt`

### Docs / validación (en implementación)

- [x] `docs/api.md` + nota en `docs/data-flows.md`
- [x] Build FE OK; smoke: endpoint 401 sin auth + service summary OK

## Fuera de alcance

- Push nativo / Service Worker
- Read receipts visibles en burbujas
- Adjuntos / tipado “escribiendo…”
- Evento SSE global obligatorio (poll es la decisión)
- Tipo `new_message` en campana (074); opcional futuro
- Redis / multi-instance fan-out
