# 019 · Memoria de progresión (último peso / reps)

**Estado:** implementado

**Depende de:** 012 (logs); se beneficia de 018

## Qué hace

Al ejecutar (cliente) o al revisar/reasignar, mostrar el **último peso y reps** registrados por el alumno para ese ejercicio, y permitir registrar nuevos valores sin alterar la plantilla ni la prescripción base salvo acuerdo explícito de producto.

## Criterios de aceptación

- [x] Endpoint (o campo en payload existente) que, dado cliente + ejercicio (por id de línea o nombre estable), devuelve último `weight`/`reps` de `workout_set_logs`
- [x] Workout Player muestra “último: X kg × Y” cuando hay historial
- [x] Al guardar sesión (012), el nuevo log queda disponible como “último” en la siguiente
- [x] Asignar plantilla (018) no borra historial previo del alumno
- [x] Ownership: client solo ve/usa sus logs; trainer solo alumnos propios
- [x] Docs api / data-flows
- [x] Build OK

## Fuera de alcance

- Gráficas de tendencia (021)
- Sugerencia automática de incremento (% o kg)
- Edición masiva de historial