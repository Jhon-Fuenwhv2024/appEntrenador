# ADR-0002 — Token de reset hasheado y respuesta genérica

## Estado

Aceptado (Feature 056).

## Contexto

El flujo forgot-password envía un enlace con token opaco por email. Si el token se guarda en claro en la BD, un leak de filas permite resetear cuentas.

## Decisión

1. Generar token con `crypto.randomBytes(32)`.
2. Persistir solo `SHA-256(token)` en `usuarios.reset_password_token`.
3. `POST /api/auth/forgot-password` siempre responde el mismo mensaje de éxito (sin enumeración de emails).
4. Invalidar token (`NULL`) tras un reset exitoso; expiración 1 hora.

## Consecuencias

- El enlace del correo lleva el token plano; la BD solo el hash.
- Usuarios sin `email` no reciben correo; el cliente no puede distinguir ese caso.
