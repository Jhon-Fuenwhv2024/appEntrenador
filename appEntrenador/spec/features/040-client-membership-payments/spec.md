# 040 · Membresía y Control de Pago del Alumno

**Estado:** pendiente
**Depende de:** 003 (JWT/roles), 004 (Ownership), 039 (Ficha 360 — UI panel; puede ir en paralelo con panel mínimo)
**Supersede / evoluciona:** **036** (pagos/suscripciones manuales) — esta feature añade vigencia con **días restantes** visibles al cliente
**Distinto de:** **037** (SaaS FREE/PRO de plataforma en `trainers_info`)

## Qué hace

Permite al entrenador gestionar la membresía de cada alumno (periodo, estado de pago, notas, bloqueo opcional) y al alumno ver cuántos **días le quedan** de membresía. Si está vencida o en mora y el trainer activa bloqueo, se aplica soft-lock al Workout Player / rutinas.

## Criterios de aceptación

### Base de datos

- [ ] Tabla `client_memberships`:
  - `client_id` UNIQUE FK → `usuarios(id)`
  - `status` ENUM/VARCHAR: `active` | `owing` | `expired`
  - `period_start` DATE, `period_end` DATE
  - `notes` TEXT nullable
  - `block_on_unpaid` BOOLEAN default false
  - `updated_by` FK → `usuarios(id)`
  - `updated_at` TIMESTAMP
- [ ] `days_remaining` calculado en service (`DATEDIFF(period_end, CURDATE())` o equivalente); no columna obligatoria.
- [ ] Migración + actualización de `script_db.sql` + `ensure*` al arranque si el proyecto usa ese patrón.

### Backend

- [ ] Módulo `backend/src/modules/memberships/` (Route → Controller → Service).
- [ ] `GET /clients/:clientId/membership` — trainer dueño.
- [ ] `PUT /clients/:clientId/membership` — trainer: status, fechas, notes, `block_on_unpaid`; upsert.
- [ ] `GET /me/membership` — client: `{ status, period_start, period_end, days_remaining, block_on_unpaid }` (sin notes internas si se desea privacidad; notes opcionales).
- [ ] Guard: si `block_on_unpaid` y status ≠ `active` (o `days_remaining < 0` / expired), bloquear inicio de sesión de workout y/o `GET /me/routines` con código claro (ej. `403` + `MEMBERSHIP_BLOCKED`).
- [ ] Ownership estricto vía `req.user` / `trainer_id`.

### UI Entrenador

- [ ] Panel “Membresía” en Ficha 360 (039) o embebido en ficha actual hasta migrar.
- [ ] Acciones: marcar active/owing/expired, fechas, renovar periodo, notas, toggle bloqueo.
- [ ] Badge en cabecera: `N días restantes` / `Vencida` / `Pendiente de pago`.
- [ ] Filtro en lista de alumnos: Al día / Por vencer (≤7 días) / Vencidos / Pendientes.

### UI Cliente

- [ ] Chip en Inicio (038) y/o Perfil: “Membresía: N días”.
- [ ] Aviso ámbar si `days_remaining <= 7` y status active.
- [ ] Banner + soft-lock del Player si bloqueado: mensaje “Tu membresía venció — habla con tu entrenador”.

## Fuera de alcance

- Pasarela de pago (Stripe / MercadoPago).
- Facturación electrónica.
- Plan SaaS del entrenador (037).
