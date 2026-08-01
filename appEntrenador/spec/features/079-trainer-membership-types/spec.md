# 079 · Tipos de membresía (precio por trainer)

**Estado:** implementada  
**Depende de:** 040 (membresía alumno), 018/022 (hub Biblioteca → **Recursos**)  
**Relacionada:** 070 (Dietas en el hub: stub; CRUD alimentos aparte)

## Qué hace

Permite al entrenador definir **tipos de membresía** propios (nombre + precio COP + duración en días), gestionarlos en el hub **Recursos** (antes Biblioteca, sin nuevo tab de bottom nav), y **asignarlos** a cada alumno. El precio se congela en la membresía (`plan_price`) y el cliente ve saldo pendiente de forma profesional (`Saldo $X`), no “Debe el mes”.

## Decisiones de producto

- Catálogo **libre por trainer** (no presets globales).
- Hub visible renombrado a **Recursos**; rutas `/trainer/library*` se mantienen.
- Pestañas: Plantillas | Catálogo | Membresías | Dietas (Dietas = empty state hasta 070).
- Snapshot de precio al asignar; `amount_paid` para pago parcial; `amount_due` derivado.
- Moneda: COP (`es-CO`).

## Criterios de aceptación

### Base de datos

- [ ] Tabla `trainer_membership_types`: `id`, `trainer_id`, `name`, `price`, `duration_days`, `is_active`, `sort_order`, timestamps
- [ ] Unique normalizado `(trainer_id, name)` validado en service
- [ ] `client_memberships`: `membership_type_id` NULL, `plan_price` NULL, `amount_paid` DEFAULT 0
- [ ] Migración `032_*` + ensure + `script_db.sql` + `docs/database-schema.md`

### Backend

- [ ] Módulo `membership-types` Route → Controller → Service
- [ ] CRUD trainer con ownership `req.user.id`
- [ ] Soft-delete si el tipo está asignado; hard-delete si no
- [ ] Memberships upsert acepta `membership_type_id` + `amount_paid`; snapshot + `period_end` por `duration_days`
- [ ] `GET /me/membership` expone tipo, precios y `amount_due`

### Frontend

- [ ] Hub Recursos: 4 tabs + panel CRUD Membresías
- [ ] `MembershipPanel`: select tipo + amount_paid
- [ ] Cliente: labels Pendiente / Saldo $X (no “Debe el mes”)
- [ ] Bottom nav label **Recursos** (key `library` sin cambio)

### Docs

- [ ] `docs/api.md`, `docs/data-flows.md`, `docs/architecture.md` actualizados

## Fuera de alcance

- Pasarela de pago
- Nueva entrada en bottom nav
- CRUD alimentos (070)
- Kanban Obsidian
