# 005 · API CRUD rutinas y ejercicios

**Estado:** implementada

## Qué hace

Módulo `routines` con CRUD de rutinas+ejercicios para trainers sobre clientes propios, y lectura para el cliente autenticado.

## Criterios de aceptación

- [x] `GET/POST /clients/:id/routines` (trainer)
- [x] `PUT/DELETE /routines/:id` (trainer)
- [x] `GET /me/routines` (client)
- [x] Transacciones al crear/actualizar ejercicios
- [x] Ownership validado en service
