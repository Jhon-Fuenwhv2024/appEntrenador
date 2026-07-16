# 038 · Rediseño Inmersivo del Modo Cliente

**Estado:** pendiente
**Depende de:** 007 (Portal cliente), 011 (Workout Player), 014 (Mobile shell), 031 (Nutrición macros), 032 (Hábitos)
**Alimenta:** 040 (chip membresía), 041 (celebraciones en Player), 042 (anillo de racha)

## Qué hace

Rediseña de forma extrema la experiencia diaria del alumno (Modo Cliente): primera pantalla centrada en un solo gesto — **“Hoy: [rutina]” → Empezar** — con atmósfera visual moderna alineada al tema dark cyan de Trainfit, micro-motion y jerarquía clara. No cambia el dominio de negocio; reorganiza UI/UX sobre APIs existentes.

## Criterios de aceptación

- [ ] **Hero del día:** En Inicio, viewport principal = rutina de hoy (o “día de descanso” / próxima rutina) + CTA primary grande “Empezar” que navega a `/client/workout/:routineId`.
- [ ] **Capas secundarias:** Hábitos del día, macros y notificaciones quedan bajo el hero (no compiten visualmente con el CTA).
- [ ] **Shell:** Bottom nav (Inicio · Progreso · Chat · Perfil) se mantiene; tipografía/atmósfera actualizada sin romper contraste (`on-primary`, `tf-overlay-menu`, ADR-0001).
- [ ] **Workout Player:** Misma “piel” visual que el dashboard (fondos, tipografía, CTAs); sin regresión de flujo de series/descanso/superseries.
- [ ] **Progreso / Perfil:** Alineados al nuevo lenguaje visual (sin rediseño de dominio).
- [ ] **Slots futuros:** Espacio reservado en header/hero para chip de membresía (040) y anillo de racha (042) sin romper layout.
- [ ] **Mobile-first:** Pass visual ~390px sin overflow horizontal; una composición por viewport (sin dashboard abarrotado).
- [ ] **Sin tablas nuevas** en esta feature (salvo endpoint opcional `GET /me/today` si reduce round-trips).

## Fuera de alcance

- Gamificación (PRs, rachas) — features **041** / **042**.
- Membresía / bloqueo de acceso — feature **040**.
- Rediseño del Modo Entrenador — feature **039**.
- Cambiar tokens globales del tema de forma incompatible con el portal trainer.
