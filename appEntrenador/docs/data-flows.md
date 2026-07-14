# Flujos de datos

## Login y sesión

1. Frontend `POST /login` → backend valida bcrypt y firma JWT.
2. Frontend guarda `token` + user en `localStorage` (`shared/auth/session.js`).
3. Axios envía `Authorization: Bearer` en cada request.
4. Middleware pobla `req.user`; roles restringen endpoints.
5. Ante `401`, el interceptor limpia sesión y redirige al login.

## Invitación → cliente del trainer

1. Trainer autenticado `POST /generate-token` → fila en `invitaciones` con `trainer_id`.
2. Cliente abre `/registro?token=...`: el frontend limpia cualquier sesión previa (`clearSession`) para no heredar el JWT del trainer.
3. `POST /register` consume el token y crea `usuarios` con `rol=client` y `trainer_id` del invite.
4. Tras éxito se vuelve a limpiar sesión y se redirige a `/` (login) para que el cliente inicie sesión con su cuenta.
5. Trainer ve al alumno en `GET /clients` (filtrado por ownership) en `/trainer/clients`.

## Asignación y lectura de rutinas

1. Trainer abre la lista en `/trainer/clients` (o CTA desde Inicio) y entra a `/trainer/clients/:id` para crear/editar rutinas vía API.
2. Service valida ownership trainer↔cliente en cada escritura.
3. Cliente autenticado `GET /me/routines` y el portal muestra plan del día / semana (con media del catálogo si hay match por nombre).

## Ejecución de rutina (Workout Player)

1. Cliente pulsa **Comenzar** en el dashboard → `/client/workout/:routineId`.
2. Frontend orquesta con `useWorkoutSession` (serie, descanso, auto-avance).
3. Al terminar, `POST /me/workout-sessions` persiste peso/reps por serie.
4. Trainer consulta `GET /clients/:id/workout-sessions` y ve el historial en la ficha del alumno.
