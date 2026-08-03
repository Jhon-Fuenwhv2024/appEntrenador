# Accesibilidad visual (baja visión) — Trainfit

**Feature:** [062-visual-accessibility-low-vision](../spec/features/062-visual-accessibility-low-vision/spec.md)  
**ADRs:** [ADR-0001](decisions/ADR-0001-contrast-on-primary.md) (CTAs/overlays) · [ADR-0002](decisions/ADR-0002-visual-accessibility-low-vision.md) (baja visión)  
**Reglas Cursor:** `.cursor/rules/ui-contrast-theme.mdc`, `.cursor/rules/ui-visual-accessibility.mdc`

## Estándar

WCAG **2.2 AA** (criterios visuales): 1.4.3, 1.4.11, 1.4.4/1.4.10, 2.4.7, 2.5.8.

## Cómo verificar

1. **Contraste:** DevTools → Inspect → Accessibility / contrast; o calculadora WCAG sobre tokens `--tf-*`.
2. **Zoom / pellizcar:** Chrome 200% + viewport ~390px; en móvil, pellizcar debe funcionar (viewport sin `user-scalable=no`).
3. **Tamaño del texto in-app:** Perfil (cliente) o Ajustes (entrenador) → **Tamaño del texto** → Grande / Muy grande. Toda la UI debe agrandarse al instante. Preferencia en `localStorage` (`tf_text_scale`).
4. **Focus:** Tab con teclado; anillo cian (`:focus-visible`) en botones, nav, campos.
5. **Icon-only:** cada botón solo-icono debe tener nombre accesible (`aria-label` o texto).

## Tokens clave (P0)

| Token | Valor (062) | Notas |
|-------|-------------|--------|
| `--tf-on-surface-muted` | `#A8B0BC` | Secundario ≥4.5:1 sobre bg/surface |
| `--tf-border` | `rgba(255,255,255,0.28)` | Bordes UI ≥3:1 aprox. |
| Focus ring | `2px solid var(--tf-primary)` | Sin reactivar `__overlay` Vuetify |
| `--tf-font-scale` | `1` / `1.2` / `1.35` | Escala in-app vía `zoom` en `html` (`textScale.js`) |
| `--tf-text-xs` … `--tf-text-2xl` | `rem` | Tokens tipográficos relativos |

## Matriz de auditoría

| Superficie | Estado | Hallazgo | Fix / notas |
|------------|--------|----------|-------------|
| **Sistema** tema + Vuetify | pass | Muted `#8b929e` borderline en elevated; border 0.08 &lt; 3:1; sin focus global | P0: muted `#A8B0BC`, border 0.28, `:focus-visible`, `medium-emphasis` ↑ |
| **Sistema** text scaling | pass | SO a menudo no llega a PWA; viewport bloqueaba pellizcar | Viewport abierto; `--tf-font-scale` + `TextScaleCard` en Perfil/Ajustes |
| **Auth** login / register / reset | pass* | `text-medium-emphasis` dependía de opacity baja | Cubierto por P0 tokens |
| **Shell** sidebar + bottom nav | pass | Inactivo `#5E6673` bajo contraste; sin focus-visible en items | P1: muted token + focus ring en `appShell.css` |
| **Shell** session actions (063) | pass | Badge solo color; logout suelto | Badge numérico + menú cuenta (`aria-label`); logout con confirmación |
| **Cliente** Inicio / hábitos | pass | Peek usaba `outline: none` en focus-visible | P1: ring + borde primary |
| **Cliente** Workout Player / sets | pass | Inputs `outline: none`; `×` `#5E6673` | P1: focus-visible + muted |
| **Cliente** preview / dieta / progreso / chat / perfil | pass* | Captions hardcoded `#8b929e` | P0/P1: variable CSS |
| **Trainer** dashboard search | pass | Placeholder `#6B7280`; input sin anillo | P1: placeholder muted + focus-within |
| **Trainer** Alumnos / invitaciones | pass | Close con `aria-label` OK | — |
| **Trainer** Client 360 resumen | pass* | Captions `#8b929e` | Variable muted |
| **Trainer** Programación / dialogs | pass | Close sin `aria-label` en 3 dialogs; quitar ejercicio en template form | P1: `aria-label="Cerrar"` / `"Quitar ejercicio"` |
| **Trainer** Catálogo / Recursos | pass* | Muted hardcode | Variable |
| **Backoffice** `/backoffice` | P2 | Texto `rgba(255,255,255,0.4–0.45)` | Deuda documentada; no bloquea 062 |
| **Admin** exercise tagger | P2 | Misma familia de opacidades bajas | Deuda P2 |

\*pass = criterios visuales AA tras fixes 062 en tokens/locales; no implica auditoría exhaustiva de cada pixel.

## Fuera de alcance (062)

- Sincronizar tamaño de texto entre dispositivos (hoy es `localStorage` local).
- Screen reader / teclado completo end-to-end.
- Dependencias axe/pa11y.
