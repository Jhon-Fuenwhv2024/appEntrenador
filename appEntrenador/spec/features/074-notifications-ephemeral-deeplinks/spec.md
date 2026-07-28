# 074 · Notificaciones efímeras, deep-links y dieta

**Estado:** implementado  
**Depende de:** 025 (notificaciones in-app), 043/064 (diet plans), 063 (header actions)  
**Relacionada:** 041 (PR), 042 (streaks), 034/073 (chat — sin `new_message` obligatorio)

## Qué hace

Moderniza el centro de notificaciones para comportarse como una app profesional: **caducan** (no acumulan para siempre), al **pulsar** navegan al destino relevante (deep-link), y el cliente recibe aviso cuando hay **cambios en el plan nutricional** activo.

## Decisiones de producto

- **TTL:** al crear, `expires_at = created_at + 30 días`. En cada `GET /notifications`, purgar filas con `expires_at < NOW()` del usuario. Además: borrar **leídas** con antigüedad > 3 días en el mismo purge.
- **Deep-link:** columnas `entity_type`, `entity_id`, `action_url` (path interno relativo, p. ej. `/client` o `/client/progress`).
- **Nuevo tipo:** `diet_updated` en el ENUM.
- **Emisión dieta:** al **activar** un plan y al **guardar** un plan que ya está activo (update del activo).
- **Click UI:** marcar leída → `router.push(action_url)` si existe → cerrar menú.
- **Dismiss:** `DELETE /api/notifications/:id` (ownership) + botón/swipe o icono en fila.

## Criterios de aceptación

### Base de datos

- [x] Migración: `entity_type` VARCHAR nullable, `entity_id` INT nullable, `action_url` VARCHAR(255) nullable, `expires_at` DATETIME/TIMESTAMP nullable
- [x] Extender ENUM `type` con `diet_updated` (mantener valores existentes)
- [x] Backfill: `expires_at = created_at + INTERVAL 30 DAY` para filas existentes
- [x] `ensureNotificationsTable` + `script_db.sql` + schema docs

### Backend

- [x] `createNotification` acepta/metadata: `entity_type`, `entity_id`, `action_url`, `expires_at` (default +30d)
- [x] `GET /` ejecuta purge (expired + leídas &gt;3d) antes de listar; sigue limit 50
- [x] `DELETE /:id` — soft no; hard delete; 404 si no ownership
- [x] Diet plans: emitir `diet_updated` al cliente en activate + update de plan activo (título/mensaje claros)
- [x] Emitters existentes (rutina, workout, PR, streak) rellenan `action_url` / entity cuando sea posible
- [x] Route → Controller → Service; auth trainer|client

### Mapa de deep-links (mínimo)

| type | Destinatario típico | `action_url` sugerida |
|------|---------------------|------------------------|
| `routine_assigned` | client | `/client/routine/:id` o `/dashboard` |
| `diet_updated` | client | `/dashboard` (home con dieta) |
| `pr_achieved` | client | `/client/progress` |
| `streak_milestone` | client | `/client/progress` |
| `routine_completed` | trainer | `/trainer/clients/:clientId` |

### Frontend

- [x] `handleNotificationClick`: mark read + navigate + close menu
- [x] Icono para `diet_updated`; copy empty state menciona dieta
- [x] Acción eliminar/descartar por ítem
- [x] Tipos sin URL: solo mark read (sin crash)
- [x] Contraste / focus / aria-labels

### Docs / validación (en implementación)

- [x] `docs/api.md`, `docs/database-schema.md`, `docs/data-flows.md`
- [x] Build FE; smoke: migración aplicada + schema verificado en TiDB

## Fuera de alcance

- Push OS / email / preferencias por tipo
- `streak_at_risk` emission (sigue pendiente de 042 salvo que se aborde aparte)
- Notificación por cada mensaje de chat (073 cubre badge Chat)
- Preferencias de TTL configurables por usuario
