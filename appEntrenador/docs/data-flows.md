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

## Perfil alumno y avatar (Feature 020)

1. Cliente abre `/client/profile` o trainer la sección Perfil en `/trainer/clients/:id`.
2. `GET /profile/:userId` con ownership (client = propio; trainer = alumno suyo).
3. Al guardar: `PUT /profile/:userId` con `FormData` (texto + opcional `foto`).
4. Multer guarda en `backend/public/uploads/avatars`; Express sirve `/uploads`.
5. Upsert en `alumnos_info`; si `foto_url` es null, la UI usa `src/assets/foto_perfil.png`.

## Ajustes de cuenta del trainer (Feature 024)

1. Trainer abre `/trainer/settings`.
2. `GET /me/account` carga nombre + `trainers_info` (teléfono/foto).
3. Editar perfil: `PUT /me/account` (FormData); se renueva el JWT con el nuevo nombre.
4. Cambiar contraseña: `POST /me/password` con password actual; la sesión no se cierra.
5. Avatar por defecto igual que alumnos si no hay `foto_url`.

## Asignación y lectura de rutinas

1. Trainer abre la lista en `/trainer/clients` (o CTA desde Inicio) y entra a `/trainer/clients/:id` para crear/editar rutinas vía API.
2. Service valida ownership trainer↔cliente en cada escritura.
3. Cliente autenticado `GET /me/routines` y el portal muestra plan del día / semana (con media del catálogo si hay match por nombre).

## Plantillas → deep copy al alumno (Feature 018)

1. Trainer crea/edita plantillas en `/trainer/library` (`POST/PATCH /templates`) o guarda una rutina existente con “Guardar en Biblioteca”.
2. Al asignar (`POST /templates/:id/assign` con `clientId` + `dia_semana?`):
   - Valida plantilla propia (`trainer_id = req.user.id`) y ownership del alumno.
   - En una transacción inserta una **nueva** fila en `rutinas` y copia cada línea a `ejercicios`.
   - No se guarda FK hacia `routine_templates`: la copia es independiente.
3. Editar o borrar la plantilla después **no** cambia las rutinas ya asignadas.

## Ejecución de rutina (Workout Player)

1. Cliente pulsa **Comenzar** en el dashboard → `/client/workout/:routineId`.
2. Frontend carga `GET /me/routines` (incluye `last_log` por ejercicio si hay historial) y orquesta con `useWorkoutSession` (serie, descanso, auto-avance).
3. El Player muestra “Último: X kg × Y” de forma informativa; **no** autocompleta los inputs con ese historial.
4. Al terminar, `POST /me/workout-sessions` persiste peso/reps por serie.
5. En la siguiente sesión, ese log queda disponible como `last_log` (match por `client_id` + nombre de ejercicio; los ids de línea de deep copy no afectan).
6. Trainer consulta `GET /clients/:id/workout-sessions` y ve el historial en la ficha del alumno; `GET /clients/:id/routines` también incluye `last_log` por ejercicio.

## Memoria de progresión (Feature 019)

1. Al listar rutinas del cliente, el service consulta el último `workout_set_logs` del alumno por **nombre exacto** del ejercicio (`JOIN workout_sessions` filtrando `client_id`).
2. No se usa `ejercicios.id` / `exercise_id` de la línea actual: al reasignar plantillas (018) esos ids cambian y el historial se perdería.
3. Payload: `ejercicios[].last_log = { weight, reps, date } | null`.
4. UI: hint en Workout Player; sin prefill de inputs.
