# Plan · 062 Accesibilidad visual (baja visión)

## Component map / superficies

| Pieza | Responsabilidad |
|-------|-----------------|
| `theme-base.css` + `vuetify.js` | Tokens contraste, focus-visible, bordes (P0) |
| ADR-0002 + regla Cursor | Política y checklist de agentes |
| `docs/accessibility-visual.md` | Matriz auditoría + cómo verificar |
| Auth / Client / Trainer views | Fixes P1 según hallazgos |
| Backoffice | P2: documentar; fix solo si es rápido |

## Reutiliza

- ADR-0001 + regla `ui-contrast-theme.mdc` (overlays, on-primary)
- Shell / bottom nav clearance (`--tf-bottom-nav-clearance`)
- Patrones `aria-label` ya usados en player y Client 360

## Estándar

WCAG 2.2 AA visual: 1.4.3, 1.4.11, 1.4.4/1.4.10, 2.4.7, 2.5.8.

## Pasos

1. SDD (`spec` / `plan` / `tasks`).
2. ADR-0002 + `.cursor/rules/ui-visual-accessibility.mdc`.
3. Auditoría por superficies → matriz en `docs/accessibility-visual.md`.
4. P0: muted/bordes + `:focus-visible` global (sin romper overlays ADR-0001).
5. P1: corregir fallos documentados en pantallas críticas.
6. `npm run build` + smoke zoom 200%; marcar tasks; roadmap al cerrar.
