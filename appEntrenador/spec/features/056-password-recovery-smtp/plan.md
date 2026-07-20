# 056 · Plan técnico

## Enfoque

1. Schema: email + reset columns en `usuarios`.
2. Mailer compartido (Nodemailer + SMTP env).
3. Auth service: `forgotPassword` / `resetPassword`.
4. FE: Login dialog, `ResetPasswordView`, email en register/account.

## Seguridad

- Respuesta forgot siempre genérica.
- Token plano solo en email; en BD hash SHA-256.
- Invalidar token tras reset exitoso.

## Paths API

- `POST /api/auth/forgot-password` `{ email }`
- `POST /api/auth/reset-password` `{ token, password }`

Montaje: rutas `/auth/*` en router auth ya montado en `/api`.
