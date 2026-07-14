# API REST

Base local por defecto: `http://localhost:3000/api`.

El frontend consume la API mediante `src/shared/api/http.js`, que permite configurar `VITE_API_URL`, adjunta `Authorization: Bearer <token>` y normaliza errores con el formato `{ success: false, error, message, code }`.

Secretos del backend: copiar `backend/.env.example` a `backend/.env` (`JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`).

## Auth

### `POST /login`

Autentica un usuario trainer o client y emite un JWT.

Body:

```json
{
  "username": "usuario",
  "password": "clave"
}
```

Respuesta exitosa:

```json
{
  "success": true,
  "message": "¡Login correcto!",
  "user": {
    "id": 1,
    "username": "usuario",
    "nombre": "Nombre",
    "rol": "trainer"
  },
  "token": "<jwt>"
}
```

### `POST /register`

Registra un cliente usando una invitación válida no usada. El servidor fuerza `rol = "client"` y asigna `trainer_id` del creador de la invitación.

Body:

```json
{
  "username": "cliente",
  "password": "clave",
  "nombre": "Nombre Cliente",
  "token": "token-invitacion"
}
```

Errores relevantes:

| Código | Cuándo |
|--------|--------|
| `400` | Falta el token, o el username ya está en uso |
| `403` | Token inexistente, ya utilizado, o sin trainer vinculado |

### `POST /generate-token` (trainer + JWT)

Genera un token y link de invitación vinculado al trainer autenticado.

Headers: `Authorization: Bearer <token>`

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Token generado con éxito",
  "token": "abc123",
  "link_invitacion": "http://localhost:5173/registro?token=abc123"
}
```

## Clientes (trainer + JWT)

### `GET /trainer/dashboard`

Métricas del portal trainer (solo alumnos propios).

Respuesta `data`:

```json
{
  "clientsCount": 2,
  "routinesCount": 5,
  "sessionsThisMonth": 3,
  "growthPercent": 100,
  "clientsThisMonth": 1,
  "clientsLastMonth": 0,
  "monthlyActivity": [
    { "month": "2026-02", "label": "feb", "clients": 1, "sessions": 0 },
    { "month": "2026-07", "label": "jul", "clients": 2, "sessions": 3 }
  ]
}
```

- `routinesCount`: rutinas asignadas a alumnos del trainer.
- `sessionsThisMonth`: sesiones `completed` del mes actual.
- `growthPercent`: variación MoM de alumnos nuevos (`created_at`).
- `monthlyActivity`: últimos 6 meses; `clients` = acumulado; `sessions` = del mes.

### `GET /clients`

Devuelve solo los clientes con `trainer_id = req.user.id`.

Cada ítem incluye `routines_count` y `status` (`Activo` si tiene ≥1 rutina, `Sin plan` si no).

UI trainer: lista en `/trainer/clients` (`ClientsListView`). La búsqueda por nombre/usuario es **filtro local** sobre esta respuesta (sin query param; suficiente para carteras pequeñas). Click → `/trainer/clients/:clientId`.

### `GET /clients/:clientId`

Detalle de un cliente propio.

## Rutinas

### `GET /clients/:clientId/routines` (trainer)

Lista rutinas + ejercicios del cliente propio.

Cada ejercicio incluye `last_log` (Feature 019): último peso/reps del alumno para ese **nombre** de ejercicio (no el id de línea; ver deep copy 018), o `null` si no hay historial.

### `POST /clients/:clientId/routines` (trainer)

Crea rutina con ejercicios (transacción).

```json
{
  "dia_semana": "Lunes",
  "nombre_rutina": "Empuje",
  "ejercicios": [
    {
      "nombre": "Press banca",
      "series": 4,
      "repeticiones": 10,
      "peso": 60,
      "indicaciones": "Controlar la bajada"
    }
  ]
}
```

### `PUT /routines/:routineId` (trainer)

Reemplaza día, nombre y ejercicios de una rutina propia.

### `DELETE /routines/:routineId` (trainer)

Elimina la rutina (cascade de `ejercicios`).

## Plantillas (Biblioteca · Feature 018)

Todas requieren JWT + `requireRole('trainer')`. Solo plantillas con `trainer_id = req.user.id`.

### `GET /templates`

Lista plantillas del trainer con `exercises[]`.

### `POST /templates`

Crea plantilla + líneas (transacción).

```json
{
  "name": "Empuje A",
  "notes": "",
  "exercises": [
    {
      "nombre": "Press banca",
      "series": 4,
      "repeticiones": 10,
      "peso": 60,
      "indicaciones": ""
    }
  ]
}
```

### `GET /templates/:id`

Detalle de una plantilla propia.

### `PATCH /templates/:id`

Actualiza nombre/notes y reemplaza ejercicios (transacción).

### `DELETE /templates/:id`

Borra la plantilla (cascade de líneas). **No** borra rutinas ya asignadas a alumnos.

### `POST /templates/:id/assign`

Deep copy a `rutinas` / `ejercicios` del alumno. Body:

```json
{ "clientId": 12, "dia_semana": "Lunes" }
```

`dia_semana` es opcional (default `Lunes`). Valida ownership del `clientId`. Respuesta `201` con la rutina creada (mismo shape que create de rutinas). Sin FK viva hacia la plantilla.

UI: `/trainer/library` (`LibraryView`); “Guardar en Biblioteca” desde ficha de alumno.

### `GET /me/routines` (client)

Lista las rutinas del cliente autenticado.

Cada ítem de `ejercicios[]` incluye (además de la prescripción):

- `media_type` / `media_url` — media del catálogo por nombre (Features 008–009)
- `last_log` — memoria de progresión (Feature 019):

```json
{
  "id": 30,
  "nombre": "Press banca",
  "series": 4,
  "repeticiones": 10,
  "peso": 60,
  "indicaciones": "",
  "media_type": "youtube",
  "media_url": "https://...",
  "last_log": {
    "weight": 62.5,
    "reps": 10,
    "date": "2026-07-13T20:15:00.000Z"
  }
}
```

`last_log` es `null` si el cliente no tiene series previas en `workout_set_logs` para ese nombre exacto. El match **no** usa `ejercicios.id` (los ids cambian al reasignar plantillas). Ownership: solo logs con `workout_sessions.client_id` = el dueño de la rutina.

## Catálogo de ejercicios (Features 008–009)

Tabla MySQL `exercises` (diccionario híbrido). Seed desde clone wrkout: `npm run seed:exercises` en `backend/` (ver [`database-schema.md`](database-schema.md)).

### `GET /exercises` (trainer)

Lista ejercicios globales (`created_by_trainer_id IS NULL`) y los del trainer autenticado.

Query:

- `?q=press` — filtro por nombre (LIKE)
- `?limit=6` — tamaño de página (default **6**, máximo **100**)
- `?page=1` — página actual (1-based)

Respuesta:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Press banca",
      "description": "...",
      "target_muscle": "Pecho",
      "media_type": "none",
      "media_url": null,
      "created_by_trainer_id": null,
      "is_global": true
    }
  ],
  "meta": {
    "total": 897,
    "limit": 6,
    "page": 1,
    "totalPages": 150,
    "returned": 6
  }
}
```

### `POST /exercises` (trainer)

Crea un ejercicio privado del trainer.

Body:

```json
{
  "name": "Mi variación",
  "target_muscle": "Pecho",
  "description": "Opcional",
  "media_type": "none",
  "media_url": null
}
```

### `PUT /exercises/:id` (trainer)

Actualiza un ejercicio visible (global o privado del trainer): nombre, descripción, músculo, `media_type` y `media_url` (GIF/YouTube/video/imagen).

### `DELETE /exercises/:id` (trainer)

Elimina un ejercicio visible (global o privado del trainer).

Las rutinas siguen enviando `ejercicios[].nombre` como texto (copia del catálogo o libre). Sin FK aún.

UI trainer: ruta `/trainer/exercises` (listar / buscar / crear / editar / borrar) y combobox en `/trainer/clients/:clientId`.

### `GET /me/routines` — media enriquecida (cliente)

Además de la prescripción, cada ejercicio incluye `media_type` y `media_url` resueltos por coincidencia de nombre contra el catálogo `exercises` (prioridad: privado del trainer del cliente, luego global). Ver también `last_log` en la sección de rutinas (Feature 019).

## Sesiones de entrenamiento (Feature 012)

Ejecución histórica. No modifica `ejercicios.peso` prescrito.

### `POST /me/workout-sessions` (client)

Guarda una sesión completada (o abandonada) con sus series.

Body:

```json
{
  "routine_id": 12,
  "routine_name": "Empuje",
  "started_at": "2026-07-13T20:00:00.000Z",
  "status": "completed",
  "sets": [
    {
      "exercise_id": 30,
      "exercise_name": "Press banca",
      "set_number": 1,
      "weight": 62.5,
      "reps": 10
    }
  ]
}
```

`client_id` siempre es `req.user.id`. `routine_id` debe pertenecer al cliente.

### `GET /clients/:clientId/workout-sessions` (trainer)

Historial del alumno propio (ownership). Incluye `sets[]` anidados.
