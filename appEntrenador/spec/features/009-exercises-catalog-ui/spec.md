# 009 · API y UI del catálogo de ejercicios

**Estado:** implementada

## Qué hace

Expone el catálogo `exercises` al trainer (GET/POST) y lo integra en el frontend:
- Página `/trainer/exercises` para listar, buscar y crear ejercicios.
- Combobox en el formulario de rutinas (copia `name` → `ejercicios.nombre`, sin FK).

## Criterios de aceptación

- [x] `GET /api/exercises` (trainer): globales + propios; filtro opcional `?q=`
- [x] `POST /api/exercises` (trainer): alta privada del trainer autenticado
- [x] Auth + rol trainer en ambos endpoints
- [x] Vista `ExercisesCatalogView` con lista, búsqueda y formulario de alta
- [x] Combobox en `ClientRoutinesView` con catálogo + texto libre
- [x] Opción de guardar nombre nuevo en el catálogo desde rutinas
- [x] Navegación sidebar trainer hacia el catálogo
- [x] Docs API / architecture / roadmap actualizados
