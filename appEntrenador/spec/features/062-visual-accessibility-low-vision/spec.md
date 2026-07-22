# 062 · Accesibilidad visual (baja visión)

**Estado:** implementado  
**Depende de:** 013 (contraste UI), ADR-0001  
**Alimenta:** gobernanza UI (ADR-0002, regla Cursor) + deuda a11y visual en toda la app

## Qué hace

Define e implementa el estándar Trainfit de **accesibilidad visual** (WCAG 2.2 AA, criterios de baja visión): contraste de texto y no-texto, zoom/reflow 200%, focus visible y tamaño mínimo de targets. Audita auth / cliente / entrenador (backoffice P2) y aplica fixes prioritarios en tokens globales y pantallas críticas.

## Criterios de aceptación

### Gobernanza

- [x] Existe `spec/features/062-visual-accessibility-low-vision/` con `spec.md`, `plan.md`, `tasks.md`.
- [x] Existe ADR-0002 documentando la política visual (relación con ADR-0001).
- [x] Existe regla Cursor `.cursor/rules/ui-visual-accessibility.mdc` con checklist al tocar UI.
- [x] Existe `docs/accessibility-visual.md` con matriz de auditoría y método de verificación.

### Sistema (P0)

- [x] Tokens muted / bordes cumplen contraste AA (texto ≥4.5:1; UI ≥3:1) en fondos `bg` / `surface`.
- [x] Focus visible global (`:focus-visible`) legible con primary, **sin** reactivar overlays blancos Vuetify.
- [x] CTAs primary siguen usando `on-primary` (sin regresión ADR-0001).

### Pantallas críticas (P1)

- [x] Hallazgos P0/P1 de la matriz corregidos o documentados con justificación.
- [x] Icon-buttons funcionales de flujos críticos tienen `aria-label` (o texto visible).
- [x] Zoom 200% en ~390px: sin scroll horizontal bloqueante ni texto cortado en login, shell, player, Client 360 resumen/programación.

### Validación

- [x] `npm run build` OK.
- [x] Smoke: auth → cliente (inicio/player) y trainer (360/programación).

## Fuera de alcance

- Preferencias de usuario (texto grande / alto contraste) en ajustes.
- Auditoría profunda de screen readers / teclado completo (salvo labels críticos rotos).
- Rediseño visual del brand (cambiar primary cian, tipografía global, etc.).
- Dependencias nuevas (axe, pa11y) sin permiso explícito.
- Fixes exhaustivos de backoffice (P2: anotar; fix solo si bloquea).
