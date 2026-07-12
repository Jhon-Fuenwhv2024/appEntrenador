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

### `GET /clients`

Devuelve solo los clientes con `trainer_id = req.user.id`.

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
