# ADR-0001 · Contraste tema oscuro (CTAs + menús)

**Estado:** aceptada  
**Fecha:** 2026-07-13  
**Feature:** 013-ui-contrast-responsive

## Contexto

1. **CTAs:** el primary `#00E5FF` es muy claro. Sin `on-primary`, los `v-btn` filled usan texto claro → ilegible.
2. **Selects/menús:** si el tema `dark` se define sin `dark: true` o con `surface-variant` claro (default Vuetify `#c8c8c8`), los items selected/hover del `v-select` quedan con fondo claro y texto blanco (p. ej. «Día de la semana»).

## Causa conocida del “blanco que tapa el texto”

Vuetify aplica `.v-list-item__overlay` / `.v-btn__overlay` con `background-color: currentColor`.
En dark, `currentColor` es blanco: si la opacidad del estado active/hover es alta, el overlay **cubre el texto** (select «Día de la semana», botones outlined, etc.).

Mitigación permanente en `src/assets/theme-base.css`: overlays a `opacity: 0`; feedback visual con fondo `rgba(0,229,255,0.16)` en el item.

## Decisión

En `src/plugin/vuetify.js`:

- Tema `dark` con `dark: true`.
- `on-primary` / `on-success` = `#0B0D12`; `on-error` = `#FFFFFF`.
- Superficies oscuras: `surface`, `surface-bright`, `surface-light`, `surface-variant` (`#2A3038`), más `on-surface` / `on-surface-variant`.
- Defaults globales: `VSelect` / `VCombobox` / `VAutocomplete` con `menuProps.contentClass = 'tf-overlay-menu'`.

CSS de refuerzo: `src/assets/theme-base.css` (tokens `--tf-*` + estilos `.tf-overlay-menu`).

Regla de agente: `.cursor/rules/ui-contrast-theme.mdc`.

CTAs filled: `color="primary"`, no hex suelto.

## Consecuencias

- Texto oscuro legible sobre cian/verde en botones.
- Listas de select/combobox legibles (sin bloques blancos).
- Base reutilizable para no repetir regresiones de contraste.
