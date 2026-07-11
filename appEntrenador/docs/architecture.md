# Arquitectura

Trainfit usa una migración modular gradual. La estructura actual mantiene compatibilidad con componentes legacy, pero las nuevas responsabilidades viven bajo límites de feature.

## Frontend

- `src/shared/api/http.js`: instancia Axios única, `baseURL` configurable con `VITE_API_URL` y normalización de errores.
- `src/features/auth/`: vistas de login/registro y llamadas de auth.
- `src/features/trainer/`: portal del entrenador, API de clientes e invitaciones y componentes del dashboard.
- `src/components/Dashboard.vue`: composición por rol; enruta a trainer o client sin contener lógica de feature.

Los componentes legacy `src/components/Login.vue`, `src/components/Register.vue` y `src/components/TrainerDashboard.vue` quedan como wrappers para no romper imports antiguos.

## Backend

El backend monta módulos bajo `/api` desde `backend/src/server.js`.

- `backend/src/modules/auth/`: login, registro por invitación y generación de invitaciones.
- `backend/src/modules/clients/`: listado de clientes para el entrenador.

Cada módulo sigue la forma `routes -> controller -> service`. Los services concentran consultas MySQL parametrizadas y los controllers traducen a respuestas JSON.
