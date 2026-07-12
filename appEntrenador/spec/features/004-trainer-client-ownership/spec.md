# 004 · Ownership trainer↔cliente

**Estado:** implementada

## Qué hace

Invitaciones y clientes quedan vinculados al trainer autenticado. El listado de clientes solo muestra alumnos propios.

## Criterios de aceptación

- [x] `invitaciones.trainer_id` y `usuarios.trainer_id` en schema + migración.
- [x] `generate-token` guarda `trainer_id` del JWT.
- [x] Registro asocia `client.trainer_id` al creador del token.
- [x] `GET /clients` filtra por `req.user.id`.
