# 043 · Plan — Recuperación de contraseña + email SMTP + password en perfil cliente

## Enfoque

1. Leer este SDD + skills aplicables (auth/backend/Vue según alcance).
2. Diseñar DDL/env/contratos API antes de UI.
3. Implementar Route → Controller → Service; ownership vía `req.user`.
4. UI mínima que cumpla aceptación; sin refactors colaterales.
5. Actualizar `docs/api.md` / schema / data-flows al cerrar.
6. Marcar `tasks.md` y mover a Hecho en roadmap.

## Archivos clave (propuestos)

- Spec: `spec/features/043-password-recovery-smtp/`
- BE/FE: a definir en implementación según módulos existentes
- Docs: `docs/api.md`, `docs/architecture.md`

## Notas

- No implementar hasta priorizar explícitamente esta feature.
- Hoy el cliente no cambia password en UI; no hay forgot-password; sin SMTP el soporte se rompe.
