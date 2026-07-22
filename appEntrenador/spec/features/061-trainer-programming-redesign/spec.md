# 061 · Rediseño Programación (trainer)

**Estado:** implementado  
**Depende de:** 039 (ficha 360), 018 (plantillas), 029 (superseries), 022 (catálogo)  
**Alimenta:** UX del tab Programación en `/trainer/clients/:clientId?tab=programacion`

## Qué hace

Rediseña el tab **Programación** del Client 360 (modo entrenador) siguiendo mejores prácticas de program builders: vista semanal como glance, flujo plantilla-primero, builder por día con progressive disclosure, y acciones rápidas (duplicar día, guardar en biblioteca). Mantiene el modelo actual `dia_semana` + deep-copy de plantillas; sin periodización multi-semana.

## Criterios de aceptación

### Vista semanal

- [x] Strip L–D con estado vacío o asignado (nombre + nº ejercicios).
- [x] Día vacío: CTAs crear / desde plantilla (día preseleccionado).
- [x] Día con rutina: editar, duplicar a otro día, guardar en biblioteca, eliminar.

### Builder

- [x] Solo visible al crear/editar; no compite con la semana.
- [x] Conserva series, reps, kg, descanso, superserie, indicaciones y vínculo catálogo.
- [x] Progressive disclosure: métricas principales visibles; Grupo e Indicaciones secundarios/colapsables.
- [x] Reordenar ejercicios (arriba/abajo).

### Plantillas

- [x] CTA **Desde biblioteca** en Programación asigna plantilla al alumno actual (deep copy + día elegido).
- [x] Guardar rutina en Biblioteca sin regresión 018.

### UX / tema

- [x] Contraste ADR-0001; CTA `color="primary"`; menús `tf-overlay-menu`.
- [x] Clearance bottom nav intacto; usable en ~390px.
- [x] Build FE OK.

## Fuera de alcance

- Periodización multi-semana, RPE/RIR, tempo, auto-progresión.
- Rediseño de `/trainer/library` (solo reutilizar assign).
- Cambios al Workout Player / preview cliente.
- Otros tabs del 360.
- Migraciones MySQL / schema nuevo.
