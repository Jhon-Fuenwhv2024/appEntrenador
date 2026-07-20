# 024 · Ajustes de cuenta

**Estado:** implementado (trainer); client password UI implemented via 045

**Depende de:** 016 (slot Ajustes)

## Qué hace

Pantalla real del 4.º destino de navegación: el usuario autenticado (trainer) puede ver/editar perfil (nombre, teléfono, foto) y cambiar contraseña de forma segura. API `/me/account` y `/me/password` también sirven a client.

## Criterios de aceptación

- [x] Ruta `/trainer/settings` (client usa `/client/profile` para datos; API cuenta compartida)
- [x] Ver nombre (y username solo lectura)
- [x] Actualizar nombre (+ teléfono/foto trainer en `trainers_info`)
- [x] Cambiar password: requiere password actual + hash bcrypt en server
- [x] JWT + solo `req.user.id`; sin editar a otros usuarios
- [x] Ítem Ajustes deja de ser placeholder vacío
- [x] Docs api
- [x] Build OK

## Fuera de alcance

- Cambio de username/email (no hay email en schema)
- 2FA, sesiones múltiples, borrar cuenta
- Preferencias de tema / notificaciones push (025 cubre badge in-app mínimo)
