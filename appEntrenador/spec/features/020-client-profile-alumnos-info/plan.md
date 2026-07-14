# 020 · Plan

## Enfoque

1. Backend: endpoints en `modules/clients` (o `modules/profile`) — get/upsert `alumnos_info` con ownership.
2. Contratos JSON alineados a columnas existentes.
3. Frontend trainer: sección en `ClientRoutinesView` o hijo `ClientProfilePanel`.
4. Frontend client: bloque en dashboard o ruta ligera bajo shell.
5. Skill auth-roles: nunca confiar en `clientId` del body sin contrastar `req.user`.

## Component map

- **ClientProfilePanel** — form presentacional (props in / emit save).
- Contenedor de ficha / dashboard — carga y guarda vía API.
