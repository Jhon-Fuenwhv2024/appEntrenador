# ADR-0008 · Desactivar pellizcar (pinch-zoom) en el viewport

**Estado:** aceptada  
**Fecha:** 2026-08-05  
**Supersede parcialmente:** [ADR-0002](ADR-0002-visual-accessibility-low-vision.md) (solo el requisito de viewport abierto / pellizcar permitido)

## Contexto

ADR-0002 exige viewport **sin** `maximum-scale` / `user-scalable=no` para cumplir WCAG 2.2 AA (zoom por pellizcar) y dejar ampliar la UI en móvil/PWA.

En uso real, el pellizcar provoca **zoom accidental** (scroll, gestos en listas, player, chat) y rompe la percepción de “app nativa”. El producto ya ofrece **escala tipográfica in-app** (`TextScaleCard` → `--tf-font-scale` / `font-size` en `html`) y tipografía en `rem`, que cubren el caso de baja visión sin CSS `zoom` en `html`.

## Decisión

1. **Viewport bloqueado** en `index.html`:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```
2. **Mitigación de accesibilidad (obligatoria mientras el pellizcar esté off):**
   - Preferencia **Tamaño del texto** (Normal / Grande / Muy grande) en Perfil (cliente) y Ajustes (entrenador).
   - Tipografía relativa (`rem` / `--tf-text-*`); **nunca** CSS `zoom` en `html`.
   - Layout usable ~390px y con escala Grande / Muy grande sin overflow horizontal bloqueante.
3. **Excepción WCAG documentada:** se acepta no cumplir el criterio de pellizcar en viewport a cambio de UX estable; el zoom de la barra del navegador (desktop) y la escala in-app siguen disponibles.

## Consecuencias

- Gestos de pellizcar ya no agrandan la pantalla en la mayoría de navegadores móviles (algunos SO/navegadores pueden ignorar `user-scalable=no`).
- Las reglas Cursor y la matriz de `docs/accessibility-visual.md` dejan de exigir pellizcar abierto.
- No reabrir el viewport sin revertir o enmendar este ADR.
