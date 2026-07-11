# Tech stack y convenciones

## Tecnologías

- **Lenguaje:** JavaScript (ES modules en frontend; CommonJS en backend). TypeScript es migración futura, no bloqueante.
- **Frontend:** Vue 3.5 + Vite 8 + Vue Router 4 + Vuetify 4 + Axios. Sin Pinia por defecto (añadir solo si el estado cruza varias vistas).
- **Backend:** Node + Express 5 (API REST en puerto 3000).
- **Base de datos:** MySQL (`coach_db`) vía `mysql2` (pool de promesas). Schema en `backend/db/script_db.sql`.
- **Tests:** aún no hay suite; validar con arranque local (Vite + Express) y criterios de aceptación de la feature.
- **Despliegue:** pendiente de definir (Netlify skills disponibles en el IDE; el repo aún no tiene `netlify.toml`).

## Archivos / módulos clave

- `src/` — SPA Vue (hoy: `components/`, `router.js`, `plugin/Vuetify.js`). Objetivo: `app/`, `shared/`, `features/`.
- `backend/src/server.js` — entrada Express; montar rutas de módulos.
- `backend/src/controllers/`, `backend/src/routes/` — auth actual; migrar a `modules/`.
- `backend/src/config/db.js` — pool MySQL (mover credenciales a env cuanto antes).
- `backend/db/script_db.sql` — contrato del schema (`usuarios`, `alumnos_info`, `rutinas`, `ejercicios`, `invitaciones`).
- `spec/` — constitución y features (SDD).
- `AGENTS.md` — reglas de comportamiento del agente.

## Comandos

- `npm run dev` (en `appEntrenador/`) — arranca Vite (frontend).
- `npm start` (en `appEntrenador/backend/`) — arranca Express.
- `npm run build` (frontend) — build de producción.
- Tests / lint — no hay scripts aún.

## Modelo de datos / dominio

- **usuarios** — `id`, `username`, `password` (hash), `nombre`, `rol` (`trainer` | `client`).
- **invitaciones** — token único; registro de cliente requiere token no usado.
- **alumnos_info** — perfil extendido del alumno (`user_id` → `usuarios`); schema listo, API pendiente.
- **rutinas** — rutina por alumno y día de semana; schema listo, API pendiente.
- **ejercicios** — series, repeticiones, peso, indicaciones; FK a `rutinas`; API pendiente.
- Registro público siempre crea `rol = 'client'`. Los trainers no se auto-registran.

## Convenciones

- Arquitectura **modular por features** (frontend) y **layered modules** (backend: routes → controller → service → queries).
- Vue: Composition API + `<script setup>`; skill `vue-best-practices` obligatoria.
- Una instancia Axios en `shared/api` (objetivo); no hardcodear `http://localhost:3000` en cada componente a medio plazo.
- SQL parametrizado; sin concatenar input de usuario en queries.
- Roles validados en servidor; no confiar solo en `localStorage`.
- Idioma de producto/docs de negocio: español. Código: consistente con el archivo tocado.
- Specs: `features/NNN-nombre/` con `spec.md` → `plan.md` → `tasks.md` antes de cambios grandes.

## Estilo visual

- Vuetify 4 con tema oscuro actual (`src/plugin/Vuetify.js`).
- Branding **Trainfit** (`src/config/app.js`, `AppLogo.vue`).
- Responsive / mobile-friendly; no rediseñar el tema global sin permiso.

## Límites duros

- No commitear `.env*` ni secretos.
- No añadir dependencias npm sin avisar.
- No cambiar el schema MySQL sin actualizar `script_db.sql` + spec y sin permiso.
- No dejar endpoints sensibles abiertos “porque es local” al añadir features nuevas.
- No acumular plantillas de ejemplo en `spec/features/`; usar features numeradas reales.
- No big-bang de carpetas: migrar código al adoptar cada feature.
