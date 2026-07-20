# 002 · Modularizar clientes y portal entrenador — Tareas

## Preparación

- [x] Confirmar que `001-modular-auth-shared-api` está implementada o que existe `src/shared/api/http.js`.
- [x] Leer `AGENTS.md`, `spec/constitution/mission.md`, `spec/constitution/tech-stack.md` y esta feature (`spec.md`, `plan.md`, `tasks.md`).
- [x] Aplicar `vue-best-practices`: revisar reactividad, SFC, data-flow y composables antes de tocar `.vue`.
- [x] Confirmar Context7; si no está disponible, usar fallback de `AGENTS.md`.
- [x] Revisar `src/components/TrainerDashboard.vue`, `src/components/Dashboard.vue`, `backend/src/server.js` y el cliente Axios creado en `001`.

## Backend

- [x] Crear `backend/src/modules/clients/`.
- [x] Crear `backend/src/modules/clients/clients.routes.js` con `GET /clients`.
- [x] Crear `backend/src/modules/clients/clients.controller.js`.
- [x] Crear `backend/src/modules/clients/clients.service.js`.
- [x] Mover la query `SELECT id, nombre, username FROM usuarios WHERE rol = "client"` desde `server.js` al service.
- [x] Usar SQL parametrizado o, si no hay parámetros, mantener la query encapsulada y sin input externo.
- [x] Responder éxito como `{ success: true, clients }`.
- [x] Responder errores como `{ success: false, error: "Mensaje", code: 500 }`.
- [x] Montar `clients.routes.js` desde `backend/src/server.js` bajo `/api`.
- [x] Eliminar del `server.js` la lógica inline de `/api/clients`.

## Frontend

- [x] Crear `src/features/trainer/`.
- [x] Crear `src/features/trainer/api/clientsApi.js` usando `src/shared/api/http.js`.
- [x] Definir `getClients()` como función de API de la feature.
- [x] Decidir dónde queda `generate-token` tras `001`: reutilizar `features/auth/api/authApi.js` o crear `src/features/trainer/api/invitationsApi.js` si la llamada es propia del entrenador.
- [x] Mover/adaptar `TrainerDashboard.vue` a `src/features/trainer/TrainerDashboardView.vue`.
- [x] Mantener `<script setup>` y orden SFC: `<script>` → `<template>` → `<style>`.
- [x] Mantener estado fuente mínimo (`alumnos`, `loading`, `error`, token/link de invitación si aplica).
- [x] Mover derivaciones de UI a `computed` cuando sean reutilizadas en template.
- [x] No usar `v-if` y `v-for` en el mismo elemento; conservar keys estables en listas.
- [x] Extraer `TrainerStatsSummary.vue` si el bloque de stats sigue mezclando varias responsabilidades.
- [x] Extraer `ClientsList.vue` si el listado de alumnos tiene markup o estados propios.
- [x] Extraer `InviteClientAction.vue` si la generación de invitaciones mezcla loading, error y presentación.
- [x] Actualizar `src/components/Dashboard.vue` o imports necesarios para usar la nueva vista del entrenador.

## Validación

- [x] Ejecutar `npm run build` en frontend.
- [x] Arrancar/verificar backend con `npm start` si el entorno local lo permite.
- [x] Smoke test manual: entrar como trainer.
- [x] Smoke test API: cargar listado de alumnos (`GET /api/clients`).
- [x] Smoke test manual: estado vacío si no hay alumnos.
- [x] Smoke test manual: error visible si falla `/api/clients`.
- [x] Smoke test manual: generar invitación desde el portal entrenador.
- [x] Confirmar que el portal cliente no se rompe.
- [x] Validar todos los criterios de aceptación de `spec.md`.

## Documentación y cierre

- [x] Actualizar `docs/api.md` o documento equivalente en `docs/` si se documenta el contrato `/api/clients`.
- [x] Actualizar `docs/architecture.md` o documento equivalente en `docs/` si se documenta el módulo `clients`.
- [x] Marcar checks completados en este `tasks.md`.
- [x] Mover la feature a "Hecho" en `../../constitution/roadmap.md` al terminar.

## Mantenimiento (checklist recurrente)

- [x] Nuevos endpoints de clientes deben vivir en `backend/src/modules/clients/`.
- [x] Nuevas llamadas HTTP del portal entrenador deben pasar por `src/features/trainer/api/` y `shared/api/http.js`.
- [x] No añadir datos mock como permanentes si existe fuente real en MySQL.
