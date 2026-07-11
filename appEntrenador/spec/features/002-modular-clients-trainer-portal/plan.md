# 002 · Modularizar clientes y portal entrenador — Plan

## Enfoque

Refactor gradual sobre la base de `001`: mover la responsabilidad de clientes fuera de `server.js` y ordenar el portal entrenador bajo `src/features/trainer/`, manteniendo comportamiento visible. No se cambia schema, no se añade auth server-side completa y no se implementan rutinas.

## Mapa de componentes

- **TrainerDashboardView** — compone el dashboard del entrenador y orquesta carga de alumnos e invitaciones.
- **TrainerStatsSummary** — muestra métricas principales derivadas de los alumnos disponibles y placeholders existentes.
- **ClientsList** — renderiza el listado de alumnos con keys estables y estado vacío.
- **InviteClientAction** — dispara la generación de invitación y expone estados de loading/error.

Los componentes deben usar props down / events up. La carga de datos y efectos viven en composables o en el contenedor de feature, no en componentes puramente presentacionales.

## Implementación

1. Confirmar que `001` dejó disponible `src/shared/api/http.js`; si no existe, detener y terminar `001` primero.
2. Crear `backend/src/modules/clients/`.
3. Mover la query de `GET /api/clients` desde `backend/src/server.js` a `clients.service.js`.
4. Crear `clients.controller.js` para responder `{ success: true, clients }` y errores JSON unificados.
5. Crear `clients.routes.js` con `GET /clients`.
6. Montar `clients.routes.js` desde `backend/src/server.js` bajo `/api`.
7. Crear `src/features/trainer/api/clientsApi.js` usando `shared/api/http.js`.
8. Crear `src/features/trainer/api/invitationsApi.js` o reutilizar el API de auth si `generate-token` quedó en `features/auth/api/authApi.js` tras `001`.
9. Mover/adaptar `TrainerDashboard.vue` a `src/features/trainer/TrainerDashboardView.vue`.
10. Extraer componentes pequeños solo donde reduzcan complejidad real: stats, lista de clientes e invitación.
11. Actualizar `Dashboard.vue` o el router/imports para apuntar a la nueva vista del entrenador.
12. Validar build y smoke tests del portal entrenador.

## Decisiones

- **Clientes como módulo propio** — `clients` representa la vista del entrenador sobre usuarios con rol `client`; evita crecer `auth` con responsabilidades ajenas.
- **Feature trainer en frontend** — el dashboard entrenador es una superficie de producto distinta del portal cliente.
- **Sin modificar DB** — el listado actual usa `usuarios`; `alumnos_info` queda para una feature posterior.
- **Sin Pinia** — el estado de alumnos es local a la vista; se extraerá a composable si la lógica crece.

## Riesgos

- **TrainerDashboard grande** — mitigación: extraer solo piezas claras y no hacer rediseño visual.
- **Dependencia con `001`** — mitigación: no duplicar Axios; si `shared/api` no existe, cerrar primero `001`.
- **Mocks mezclados con datos reales** — mitigación: documentar qué métricas siguen mock y no presentarlas como datos conectados.
