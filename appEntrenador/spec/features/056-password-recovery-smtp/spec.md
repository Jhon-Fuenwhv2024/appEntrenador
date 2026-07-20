# 056 · Recuperación de contraseña + email SMTP

**Estado:** implementado  
**Depende de:** 001 (auth modular), 024 (account / password rules)  
**Relacionada:** roadmap listaba esto como **046** (colisión con `046-exercise-muscle-tagger`); ejecución SDD = **056**. UI cambio password autenticado = **045**.

## Qué hace

Permite a trainer y client recuperar acceso vía email: forgot-password → enlace con token → reset. Añade `email` a `usuarios` (registro + cuenta).

## Criterios de aceptación

### Base de datos

- [x] `usuarios.email` VARCHAR UNIQUE (nullable en migración; obligatorio en registro nuevo)
- [x] `reset_password_token` + `reset_password_expires` en `usuarios`
- [x] `script_db.sql` + migración + ensure al arranque

### Backend

- [x] `POST /api/auth/forgot-password` — respuesta genérica; token SHA-256 en BD; mail Nodemailer SMTP; expiry 1h
- [x] `POST /api/auth/reset-password` — valida token+expiry; bcrypt; invalida token
- [x] Registro exige email; account GET/PATCH incluye email
- [x] Sin secretos hardcodeados; SMTP vía `.env`

### Frontend

- [x] Login: enlace “¿Olvidaste tu contraseña?” + diálogo email
- [x] Vista pública `/reset-password?token=`
- [x] Campo email en registro y en ajustes/perfil
- [x] Contraste Trainfit (CTA primary)

### Validación

- [x] Build FE + arranque BE OK
- [x] Smoke API forgot (200 genérico) + reset inválido (400)

## Fuera de alcance

- Login por email
- Invites por email (047)
- Renumerar muscle-tagger
- Rate-limit Redis
