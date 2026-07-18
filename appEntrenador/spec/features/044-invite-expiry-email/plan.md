# 044 · Plan — Caducidad y envío de invitaciones por email

## Enfoque

1. Leer este SDD + skills aplicables (auth/backend/Vue según alcance).
2. Diseñar DDL/env/contratos API antes de UI.
3. Implementar Route → Controller → Service; ownership vía `req.user`.
4. UI mínima que cumpla aceptación; sin refactors colaterales.
5. Actualizar `docs/api.md` / schema / data-flows al cerrar.
6. Marcar `tasks.md` y mover a Hecho en roadmap.

## Archivos clave (propuestos)

- Spec: `spec/features/044-invite-expiry-email/`
- BE/FE: a definir en implementación según módulos existentes
- Docs: `docs/api.md`, `docs/architecture.md`

## Notas

- No implementar hasta priorizar explícitamente esta feature.
- Operativa real del trainer: hoy solo copiar link; invitaciones sin caducidad clara ni email.
