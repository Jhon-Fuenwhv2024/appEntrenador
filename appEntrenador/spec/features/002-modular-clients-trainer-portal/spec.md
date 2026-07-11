# 002 · Modularizar clientes y portal entrenador

**Estado:** implementada; build y smoke API OK; pendiente prueba manual en navegador

## Qué hace

Reorganiza la gestión de clientes del entrenador para que el listado de alumnos y el dashboard del entrenador queden bajo límites de feature claros: `src/features/trainer/` en frontend y `backend/src/modules/clients/` en backend.

El comportamiento visible debe mantenerse: el entrenador ve sus alumnos, puede generar invitaciones y accede al dashboard sin cambios funcionales grandes.

## Por qué

Hoy `GET /api/clients` vive directamente en `backend/src/server.js` y `TrainerDashboard.vue` concentra UI, estado, llamadas HTTP y datos mock. Esta feature continúa la arquitectura modular iniciada en `001`, reduce deuda y deja el proyecto preparado para perfil de alumno, rutinas y permisos server-side.

## Criterios de aceptación

- [ ] `GET /api/clients` vive en `backend/src/modules/clients/` con routes, controller y service.
- [ ] `backend/src/server.js` solo monta el módulo de clientes; no contiene SQL ni lógica de negocio de clientes.
- [ ] El frontend consume clientes mediante `src/features/trainer/api/clientsApi.js` usando `src/shared/api/http.js`.
- [ ] `TrainerDashboard` vive bajo `src/features/trainer/` o queda reemplazado por una vista equivalente importada desde esa feature.
- [ ] La UI del entrenador conserva el listado de alumnos y la generación de invitaciones.
- [ ] Los errores de clientes usan el formato JSON unificado del backend.
- [ ] No se cambia el schema MySQL ni se añade CRUD de rutinas en esta feature.
- [ ] `spec/constitution/roadmap.md` refleja el estado al cerrar la feature.

## Fuera de alcance

- JWT/sesiones y middleware de roles completos (feature separada).
- CRUD profundo de alumnos (`alumnos_info`) más allá del listado actual.
- Rutinas y ejercicios.
- Rediseño visual global.
- Pinia o migración a TypeScript.
