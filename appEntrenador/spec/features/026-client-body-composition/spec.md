# 026 · Composición corporal del cliente

**Estado:** pendiente

**Depende de:** 020 (ficha/perfil alumno); se beneficia de 021 (pantalla “Mi progreso” como hogar de lectura cliente)

## Qué hace

Permite al **trainer** registrar y actualizar mediciones antropométricas / de composición corporal de sus alumnos (peso, % grasa, IMC y campos relacionados) como **historial fechado**. El **cliente** solo puede **consultar** su última medición y el historial; no crea ni edita registros.

Distinto de:

- **020 `alumnos_info`** — perfil estático (teléfono, objetivo, lesiones…), no serie temporal.
- **021 progreso de rutinas** — sesiones y pesos de ejercicios (`workout_*`), no antropometría.

## Dominio (MVP)

Cada registro pertenece a un alumno (`client_id`) y tiene fecha de medición. Campos mínimos:

| Campo | Tipo | Notas |
|-------|------|--------|
| `measured_at` | date/datetime | Fecha de la toma |
| `weight_kg` | decimal | Peso corporal |
| `body_fat_pct` | decimal nullable | % grasa |
| `bmi` | decimal nullable | IMC (calculado server-side si hay altura + peso, o editable si se acuerda) |
| `height_cm` | decimal nullable | Altura (puede repetirse o usarse la última conocida) |
| `muscle_mass_kg` | decimal nullable | Masa muscular (opcional MVP) |
| `notes` | text nullable | Observaciones del trainer |
| `recorded_by` | FK trainer | Quién registró |

Campos opcionales post-MVP (fuera de alcance inicial): circunferencias (cintura, cadera, brazo), % músculo, agua corporal, densitometría, fotos de progreso.

## Criterios de aceptación

### Datos y API

- [ ] Tabla de historial (p. ej. `body_composition_logs` o nombre acordado) en `script_db.sql` + docs schema
- [ ] Trainer: `POST` crear medición de un alumno propio
- [ ] Trainer: `PUT`/`PATCH` actualizar medición existente (solo si el alumno es suyo)
- [ ] Trainer: `GET` listado (y opcionalmente último) por `clientId` con ownership
- [ ] Client: `GET /me/...` listado y/o último registro; **sin** POST/PUT/DELETE
- [ ] Validación server-side (rangos razonables; SQL parametrizado)
- [ ] Ownership estricto vía `req.user`; denegar acceso a alumnos de otro trainer

### UI

- [ ] Trainer: sección en ficha del alumno para crear/editar/ver historial de composición corporal
- [ ] Client: vista de solo lectura (bloque en “Mi progreso” / dashboard o ruta ligera bajo shell)
- [ ] Contraste tema dark / CTAs `color="primary"` según reglas UI del proyecto

### Cierre

- [ ] Docs `api` / `data-flows` / `database-schema`
- [ ] Build OK (frontend) y API arranca sin errores de ruta

## Fuera de alcance

- Charts avanzados / comparativas entre alumnos
- Export CSV/PDF
- El cliente auto-registra peso o % grasa
- Fotos de progreso / Image CDN
- Sustituir o mezclar con logs de workout (021)
- Circunferencias y métricas avanzadas (backlog de ampliación de esta feature)
