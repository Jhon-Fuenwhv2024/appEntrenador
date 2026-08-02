# 081 · Alineación UI check-in cliente (pills 1–5)

**Estado:** implementado  
**Depende de:** 033 (check-in + fotos), 072 (CTA en Mi progreso), 062 (accesibilidad visual)  
**Relacionada:** 013 (contraste), 038 (modo cliente)

## Qué hace

Alinea el modal de **check-in semanal** del cliente con el sistema visual Trainfit: escala **1–5 en pills** con acento único `primary` (#00E5FF), chrome de diálogo (icono cyan, subtítulo muted, CTAs outlined + primary flat). Evoluciona solo la UI de **033**; no cambia dominio ni contrato API.

## Decisiones de producto

- Sustituir `v-rating` multicolor (primary / warning / success) por pills numeradas 1–5.
- Acento activo único: `primary` (ADR-0001 / tokens tema).
- Dialog centrado (no bottom sheet).
- Mismos campos: `sleep_quality`, `stress_level`, `diet_adherence` (INT 1–5), notas y fotos opcionales.

## Criterios de aceptación

### UI

- [x] Header con icono en caja cyan, título “Check-in semanal”, subtítulo muted y botón cerrar con `aria-label`
- [x] Tres métricas (sueño, estrés, dieta) con fila de pills 1–5; valor seleccionado visible (p. ej. `3/5`)
- [x] Pill activa con borde/fondo primary; inactivas neutras (tokens `--tf-*`)
- [x] CTAs: Cancelar `outlined` + Enviar `color="primary" variant="flat"` (texto on-primary)
- [x] Notas y fotos opcionales conservadas (033)

### Accesibilidad

- [x] Cada escala: `role="radiogroup"` + opciones `role="radio"` / `aria-checked`
- [x] Target táctil ≥44px en pills; `:focus-visible` con outline primary
- [x] Contraste texto ≥4.5:1 (ADR-0002); ~390px sin overflow horizontal
- [x] Sin overlays Vuetify opacos (ADR-0001)

### Datos / API

- [x] `POST` check-in idéntico (FormData sin cambios de nombres/tipos)
- [x] Sin migraciones ni cambios backend

### Docs / validación

- [x] Spec / plan / tasks en `081-client-checkin-ui-alignment/`
- [x] Build FE OK; smoke: hero → abrir → pills → enviar

## Fuera de alcance

- Backend / schema / endpoints
- Historial trainer (`CheckinsHistoryPanel` y chips semánticos de lectura)
- Bottom sheet móvil
- Cambiar copy de las tres métricas o añadir preguntas dinámicas
