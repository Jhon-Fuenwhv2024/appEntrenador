# 007 · Portal cliente con rutinas reales

**Estado:** implementada

## Qué hace

El dashboard del cliente consume `GET /me/routines` y muestra plan del día / semanal sin mocks.

## Criterios de aceptación

- [x] `features/client/ClientDashboardView.vue`
- [x] Empty state si no hay rutinas
- [x] Sesión del día + resumen semanal desde API
