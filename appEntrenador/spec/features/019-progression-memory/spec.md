# 019 · Memoria de progresión (último peso / reps)

**Estado:** pendiente

**Depende de:** 012 (logs); se beneficia de 018

## Qué hace

Al ejecutar (cliente) o al revisar/reasignar, mostrar el **último peso y reps** registrados por el alumno para ese ejercicio, y permitir registrar nuevos valores sin alterar la plantilla ni la prescripción base salvo acuerdo explícito de producto.

## Criterios de aceptación

- [ ] Endpoint (o campo en payload existente) que, dado cliente + ejercicio (por id de línea o nombre estable), devuelve último `weight`/`reps` de `workout_set_logs`
- [ ] Workout Player muestra “último: X kg × Y” cuando hay historial
- [ ] Al guardar sesión (012), el nuevo log queda disponible como “último” en la siguiente
- [ ] Asignar plantilla (018) no borra historial previo del alumno
- [ ] Ownership: client solo ve/usa sus logs; trainer solo alumnos propios
- [ ] Docs api / data-flows
- [ ] Build OK

## Fuera de alcance

- Gráficas de tendencia (021)
- Sugerencia automática de incremento (% o kg)
- Edición masiva de historial
