# ADR-0002 · Accesibilidad visual (baja visión)

**Estado:** aceptada  
**Fecha:** 2026-07-22  
**Feature:** 062-visual-accessibility-low-vision

## Contexto

Trainfit ya resolvió el contraste de CTAs y overlays Vuetify en **ADR-0001** (feature 013). Falta una política explícita para personas con **baja visión**: contraste de texto secundario, bordes de controles, anillo de foco, zoom 200% y tamaño mínimo de targets en toda la app (auth, cliente, entrenador).

Sin esta política, cada pantalla reintroduce grises `#8b929e`, `outline: none` o icon-buttons sin nombre accesible.

## Decisión

1. **Estándar:** WCAG **2.2 nivel AA**, criterios visuales:
   - 1.4.3 Contraste de texto (≥4.5:1 normal; ≥3:1 texto grande)
   - 1.4.11 Contraste no-texto (≥3:1 bordes/iconos funcionales/focus)
   - 1.4.4 / 1.4.10 Zoom y reflow (usable al **200%**, ~390px sin scroll horizontal bloqueante)
   - 2.4.7 Focus visible
   - 2.5.8 Target size (mín. 24×24 CSS px; preferir ≥44px en touch)

2. **Fuente de tokens:** `src/plugin/vuetify.js` + `src/assets/theme-base.css`.  
   Muted y bordes deben cumplir AA sobre `background` (`#121212`) y `surface` (`#1E1E1E`).

3. **Focus:** anillo `:focus-visible` con `--tf-primary`, offset oscuro; **nunca** reactivar `.v-*-__overlay` opacos (ADR-0001).

4. **Icon-only:** todo control solo-icono funcional lleva `aria-label` (o texto visible equivalente).

5. **No color-only:** estados (pago, racha, error) acompañan color con texto/icono/patrón.

6. **Gobernanza:** regla Cursor `.cursor/rules/ui-visual-accessibility.mdc` + matriz en `docs/accessibility-visual.md`.

## Relación con ADR-0001

ADR-0001 sigue vigente para CTAs `on-primary`/`on-success` y overlays de menú. ADR-0002 **extiende** el alcance a muted, focus, zoom y targets; no sustituye ADR-0001.

## Consecuencias

- Texto secundario y outlined buttons más claros (muted más luminoso).
- Focus keyboard visible en shell, botones y campos.
- Checklist obligatoria en PRs/UI para agentes y humanos.
- Deuda P2 (backoffice) documentada, no bloqueante del cierre de 062.
