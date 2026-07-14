# 024 · Ajustes de cuenta

**Estado:** pendiente

**Depende de:** 016 (slot Ajustes)

## Qué hace

Pantalla real del 4.º destino de navegación: el usuario autenticado (trainer o client) puede ver/editar datos básicos de cuenta (nombre) y cambiar contraseña de forma segura.

## Criterios de aceptación

- [ ] Ruta `/trainer/settings` y equivalente client (o ruta compartida `/settings` filtrada por rol)
- [ ] Ver nombre (y username solo lectura)
- [ ] Actualizar nombre
- [ ] Cambiar password: requiere password actual + hash bcrypt en server
- [ ] JWT + solo `req.user.id`; sin editar a otros usuarios
- [ ] Ítem Ajustes deja de ser placeholder vacío
- [ ] Docs api
- [ ] Build OK

## Fuera de alcance

- Cambio de username/email (no hay email en schema)
- 2FA, sesiones múltiples, borrar cuenta
- Preferencias de tema / notificaciones push (025 cubre badge in-app mínimo)
