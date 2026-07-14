# 024 · Plan

## Enfoque

1. Backend en `modules/auth` o `modules/account`: `GET/PATCH /me`, `POST /me/password`.
2. Frontend: `SettingsView` compartido o por rol; form nombre + form password.
3. Tras cambio de password: mantener sesión o forzar re-login (decidir y documentar).
4. Skill auth-roles obligatoria.

## Component map

- **AccountProfileForm** — nombre.
- **ChangePasswordForm** — passwords.
- **SettingsView** — composición de ruta.
