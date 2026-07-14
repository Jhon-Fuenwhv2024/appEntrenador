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

### `GET /clients/:clientId`

Detalle de un cliente propio.

## Rutinas

### `GET /clients/:clientId/routines` (trainer)

Lista rutinas + ejercicios del cliente propio.

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

Elimina la rutina (cascade a ejercicios).

### `GET /me/routines` (client)

Lista las rutinas del cliente autenticado.

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

Actualiza un ejercicio privado propiedad del trainer: nombre, descripción, músculo, `media_type` y `media_url` (GIF/YouTube/video/imagen). Los ejercicios globales son de solo lectura y devuelven `403`.

### `DELETE /exercises/:id` (trainer)

Elimina un ejercicio privado propiedad del trainer. Los ejercicios globales son de solo lectura y devuelven `403`.

Las rutinas siguen enviando `ejercicios[].nombre` como texto (copia del catálogo o libre). Sin FK aún.

UI trainer: ruta `/trainer/exercises` (listar / buscar / crear / editar / borrar) y combobox en `/trainer/clients/:clientId`.

### `GET /me/routines` — media enriquecida (cliente)

Además de la prescripción, cada ejercicio incluye `media_type` y `media_url` resueltos por coincidencia de nombre contra el catálogo `exercises` (prioridad: privado del trainer del cliente, luego global).

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
