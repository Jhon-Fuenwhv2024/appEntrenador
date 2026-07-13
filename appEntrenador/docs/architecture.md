# Arquitectura

Trainfit usa una migración modular gradual. La estructura actual mantiene compatibilidad con componentes legacy, pero las nuevas responsabilidades viven bajo límites de feature.

## Frontend

- `src/shared/api/http.js`: instancia Axios única, `baseURL` configurable con `VITE_API_URL`, Bearer JWT e interceptor de errores/401.
- `src/shared/auth/session.js`: persistencia de token + datos de usuario en `localStorage`.
- `src/features/auth/`: vistas de login/registro y llamadas de auth.
- `src/features/trainer/`: portal del entrenador, clientes, invitaciones y asignación de rutinas (`ClientRoutinesView`).
- `src/features/client/`: portal del cliente con rutinas reales (`ClientDashboardView`).
- `src/components/Dashboard.vue`: composición por rol; enruta a trainer o client sin contener lógica de feature.

Los componentes legacy `src/components/Login.vue`, `src/components/Register.vue`, `src/components/TrainerDashboard.vue` y `src/components/ClientDashboard.vue` quedan como wrappers cuando aplica.

## Backend

El backend monta módulos bajo `/api` desde `backend/src/server.js`.

- `backend/src/middleware/auth.js`: JWT (`authenticate`) y roles (`requireRole`).
- `backend/src/modules/auth/`: login (emite JWT), registro por invitación y generación de invitaciones (trainer).
- `backend/src/modules/clients/`: listado/detalle de clientes del trainer autenticado.
- `backend/src/modules/routines/`: CRUD de rutinas/ejercicios (líneas de rutina) con ownership.
- `backend/src/modules/exercises/`: catálogo `exercises` — `GET/POST /api/exercises` (trainer: globales + propios). Seed en `backend/scripts/seedExercises.js`. Las rutinas copian `name` a `ejercicios.nombre` (sin FK). Ver [`docs/database-schema.md`](database-schema.md).
- Frontend trainer: `ExercisesCatalogView` (`/trainer/exercises`) gestiona el catálogo; `ClientRoutinesView` usa combobox al crear/editar rutinas (`features/trainer/api/exercisesApi.js`, `composables/useExercisesCatalog.js`).

Cada módulo sigue la forma `routes -> controller -> service`. Los services concentran consultas MySQL parametrizadas y los controllers traducen a respuestas JSON.

## Ownership

- `invitaciones.trainer_id`: trainer que generó el token.
- `usuarios.trainer_id`: trainer dueño del cliente (NULL en trainers).
- Las mutaciones de rutinas validan que el alumno pertenezca a `req.user.id`.
