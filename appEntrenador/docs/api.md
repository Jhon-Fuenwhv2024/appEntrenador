# API REST

Base local por defecto: `http://localhost:3000/api`.

El frontend consume la API mediante `src/shared/api/http.js`, que permite configurar `VITE_API_URL` y normaliza errores con el formato `{ success: false, error, message, code }`.

## Auth

### `POST /login`

Autentica un usuario trainer o client.

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
  }
}
```

### `POST /register`

Registra un cliente usando una invitación válida no usada. El servidor fuerza `rol = "client"`.

Body:

```json
{
  "username": "cliente",
  "password": "clave",
  "nombre": "Nombre Cliente",
  "token": "token-invitacion"
}
```

### `POST /generate-token`

Genera un token y link de invitación para registrar clientes.

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Token generado con éxito",
  "token": "abc123",
  "link_invitacion": "http://localhost:5173/registro?token=abc123"
}
```

## Clientes

### `GET /clients`

Devuelve usuarios con rol `client` para el portal del entrenador.

Respuesta exitosa:

```json
{
  "success": true,
  "clients": [
    {
      "id": 1,
      "nombre": "Cliente",
      "username": "cliente"
    }
  ]
}
```
