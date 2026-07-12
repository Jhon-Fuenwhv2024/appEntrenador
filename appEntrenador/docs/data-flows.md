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
5. Trainer ve al alumno en `GET /clients` (filtrado por ownership).

## Asignación y lectura de rutinas

1. Trainer abre `/trainer/clients/:id` y crea/edita rutinas vía API.
2. Service valida ownership trainer↔cliente en cada escritura.
3. Cliente autenticado `GET /me/routines` y el portal muestra plan del día / semana.
