# 082 · Membresía del gym (recordatorio personal)

**Estado:** implementado  
**Depende de:** 020 (perfil), 025/051/075 (notificaciones + push + jobs), 045 (perfil cliente)  
**Distinto de:** **040** / **079** / **080** (membresía/pago con el entrenador en `client_memberships`)

## Qué hace

Permite al **cliente** configurar en Mi Perfil la fecha de vencimiento de su **membresía del gimnasio físico** (nombre opcional) y recibir avisos in-app + push a 7 / 3 / 1 días y el día de vencimiento. Independiente del plan/pago al entrenador; **no** aplica soft-lock.

## Criterios de aceptación

### Base de datos

- [x] Tabla `client_gym_memberships` 1:1 con cliente (`client_id` UNIQUE)
- [x] Campos: `gym_name` nullable, `expires_on` DATE, `notify_enabled` BOOLEAN default true, `updated_at`
- [x] Migración `033_*` + `script_db.sql` + `ensure*` al arranque
- [x] ENUM `notifications.type`: `gym_membership_expiring`, `gym_membership_expired`

### Backend

- [x] Módulo `gym-membership` Route → Controller → Service
- [x] `GET /me/gym-membership` (client) → data o `null`
- [x] `PUT /me/gym-membership` upsert `{ gym_name?, expires_on, notify_enabled? }`
- [x] `DELETE /me/gym-membership` borra fila
- [x] Auth: `authenticate` + `requireRole('client')`; ownership = `req.user.id`
- [x] Job: avisos 7/3/1/0 a hora 9; dedupe `gym_membership:{n}:{date}`; solo cliente; deep-link `/client/profile`

### UI Cliente

- [x] Sección en `/client/profile` después de Plan (entrenador)
- [x] Form: nombre gym, fecha, toggle avisos, Guardar / Quitar
- [x] Chip días restantes / vacío guiado
- [x] Iconos campana para tipos nuevos
- [x] Contraste / a11y / ~390px / bottom-nav

### Docs

- [x] `docs/api.md` + `docs/data-flows.md`

## Fuera de alcance

- UI trainer / ficha 360
- Soft-lock de rutinas
- Pagos / renovación automática
- Preferencias por tipo de notificación
