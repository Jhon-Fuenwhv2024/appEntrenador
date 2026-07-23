# 067 · Editor nutricional: jerarquía comida/alimento + preview en vivo

**Estado:** especificado  
**Depende de:** 064 (ciclo multi-semana), 057 (jerarquía visual cliente), 043 (módulo diet plans)  
**Alimenta:** tab Nutrición & Hábitos del Client 360 (modo trainer)

## Qué hace

Mejora el llenado del plan nutricional en el editor del entrenador:

1. **Diferenciar visualmente** el nombre del **tipo de comida** (Desayuno, Almuerzo…) de los **alimentos** (filas de ítems).
2. Mostrar a la **izquierda** (desktop) una **vista previa en tiempo real** con la misma jerarquía/look que ve el cliente (`ClientDietView`), sincronizada con el día/semana activos del draft.

Hoy: meal name y alimento usan el mismo estilo de input; el editor es full-width sin preview del lado cliente.

## Criterios de aceptación

### Jerarquía en el editor

- [ ] “Nombre de la comida” se percibe como título de bloque (mayor peso/tamaño, acento del card); “Hora” secundaria.
- [ ] Filas de alimento más densas/compactas (nombre de ítem más pequeño que el de la comida), alineadas en espíritu a `.cdv__meal-name` vs `.cdv__item-name` (057).
- [ ] Sin cambio de modelo de datos ni de payload CRUD (064).

### Preview en vivo

- [ ] Desktop (≥960px): layout split — **izquierda** preview cliente, **derecha** editor.
- [ ] Móvil (&lt;960px): preview colapsable (arriba o bajo el strip de días) + editor; sin romper `--tf-bottom-nav-clearance`.
- [ ] Preview refleja el draft actual (semana/día activos, comidas, ítems, macros) al editar, sin guardar obligatorio.
- [ ] Reutilizar `ClientDietView` (o extract presentacional) con modo preview: `skipFetch` **sin** llamar `GET /me/*`; datos inyectados vía adapter desde el draft.
- [ ] Strip/semana del preview coherente con el draft (weekPreview local o equivalente).

### UX / tema

- [ ] Contraste ADR-0001; overlays/menús con `tf-overlay-menu` si aplica.
- [ ] Focus visible; targets táctiles razonables en controles del editor.
- [ ] Zoom ~200% / ~390px: sin overflow horizontal bloqueante.

## Fuera de alcance

- Catálogo global de alimentos / autocomplete externo / AI.
- Registro diario de adherencia (053).
- Cambiar APIs de resolve cliente (`GET /me/diet-plan`) salvo props de preview en el componente.
- Rediseñar tabs Semana / strip L–D (064) más allá de lo necesario para el split.
