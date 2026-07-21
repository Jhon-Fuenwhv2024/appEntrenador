# 057 · Jerarquía visual comida vs productos (cliente)

**Estado:** implementado  
**Depende de:** 043 (planes de dieta), 038 (home immersivo)  
**Relacionada:** 031 (macros / objetivos diarios)

## Qué hace

Mejora la UI de solo lectura del plan de dieta en el home del cliente para que se distinga claramente el **tipo de comida** (Desayuno, Almuerzo, etc.) de los **productos/alimentos** dentro de cada comida. Patrón tipo diario nutricional (cabecera fuerte + filas anidadas + acordeón).

## Criterios de aceptación

### Frontend

- [x] `ClientDietView` muestra cada comida con cabecera destacada (icono/acento, nombre, `time_hint`, kcal de la comida)
- [x] Los items (`food_name`, cantidad, macros) se ven como filas secundarias anidadas
- [x] Acordeón: todas colapsadas al cargar; el usuario expande por tap en cabecera
- [x] Acentos de color por tipo de comida (heurística por nombre) compatibles con tema dark Trainfit
- [x] Sin cambios de contrato API; solo presentación
- [x] Mobile ~390px sin overflow; contraste ADR-0001

### Fuera de alcance

- Logging diario de lo comido
- Edición del plan por el cliente
- Cambios en `DietPlanPanel` (trainer)
