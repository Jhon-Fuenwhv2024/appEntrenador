# 072 · Rediseño UX “Mi progreso”

**Estado:** especificado  
**Depende de:** 021 (historial progreso), 027 (gráficas), 026 (body composition), 041 (PRs), 042 (rachas), 033 (check-in)  
**Relacionada:** 038 (modo cliente inmersivo)

## Qué hace

Reorganiza la vista cliente **Mi progreso** para que sea **entendible en ~5 segundos**: hero de estado al instante, tendencias con rango 7/30/90 días y contexto (sube/baja/estable), luego logros e historial. Reduce la sensación de “dos apps” (tabs Resumen vs Gráficas) sin cambiar el dominio de datos ni añadir librerías de charts.

## Decisiones de producto (research fitness UX 2025)

- Jerarquía: **resumen al instante → tendencias → detalle**.
- Hero con 2–3 señales máximo (racha, sesiones 7d, delta de peso si hay datos).
- Filtros de rango **7 / 30 / 90 días** en tendencias de peso/fuerza.
- Contexto de tendencia textual/icono, no solo el número crudo.
- Check-in semanal como CTA primaria visible en el hero/header.
- Mantener **Chart.js + vue-chartjs** (027); no Apex/ECharts.
- Densidad: menos apilado vertical continuo; secciones claras (cards/bloques con un propósito).

## Criterios de aceptación

### IA / estructura de pantalla

- [ ] Hero superior: racha actual (+ mejor racha secundaria), sesiones últimos 7 días, delta de peso reciente si ≥2 logs de body composition
- [ ] Bloque **Tendencias** con selector 7/30/90: peso/IMC y fuerza (ejercicio seleccionable); empty state amigable si <2 puntos
- [ ] Actividad semanal compacta (reutilizar/adaptar `ProgressActivityBars` o chart de actividad)
- [ ] Bloque **Logros**: PRs (reutilizar `PersonalRecordsSection`)
- [ ] Bloque **Historial**: smart history de sesiones + body composition read-only al final
- [ ] CTA Check-in visible sin buscar en el scroll profundo
- [ ] Tabs Resumen/Gráficas unificados o sustituidos por scroll de una sola composición (documentar en plan la variante elegida: **single scroll con anclas**)

### Datos / APIs

- [ ] Reutilizar endpoints existentes (`/me/workout-sessions`, `/me/consistency`, `/me/personal-records`, `/me/body-composition`, `/progress/metrics`, `/progress/exercises`)
- [ ] Filtrado 7/30/90 en cliente sobre series ya cargadas (o query param si el backend ya lo soporta; no exigir migración)
- [ ] Delta de peso: último log vs log anterior dentro del rango (o vs primer punto del rango) — especificar en UI “±X kg”

### UX / accesibilidad

- [ ] Contraste ADR-0001; focus visible; targets táctiles; ~390px sin overflow horizontal
- [ ] Clearance `--tf-bottom-nav-clearance`
- [ ] Copy vacío motivador (“Entrena y registra peso para ver tu evolución”)

### Docs / validación (en implementación)

- [ ] Si cambia flujo de UI relevante: nota breve en `docs/` (opcional si solo layout)
- [ ] Build FE OK; smoke visual Resumen → Tendencias → Historial

## Fuera de alcance

- Nuevas métricas (pasos, sueño, HR, wearables)
- Export PDF/imagen de gráficas
- Gamificación nueva (badges, niveles)
- Mostrar check-ins históricos en esta pantalla (trainer ya los ve en 360)
- Subir el límite de 50 sesiones en backend (puede listarse como mejora futura)
- Rediseño de Client 360 gráficas del trainer (solo cliente, salvo reutilizar componentes compartidos sin romper trainer)
