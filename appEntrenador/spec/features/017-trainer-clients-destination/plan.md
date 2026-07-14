# 017 · Plan

## Enfoque

1. **Extracción y Composición:** Crear la vista `ClientsListView` en `features/trainer/` montada en la ruta `/trainer/clients`. Este será el componente "Smart" que maneja la lógica y las llamadas a la API.
2. **Consumo de API:** Reutilizar `GET /api/clients` (incluyendo los estados de la Feature 015). Implementar búsqueda reactiva (query `q`) localmente mediante `computed properties` en el frontend para filtrar la lista instantáneamente sin recargar el servidor.
3. **Reducción del Hub:** Adelgazar `TrainerDashboardView`. Ahora solo debe mostrar: Métricas (Stats), CTA de invitación, y un resumen/enlace ("Ver todos mis alumnos"). Se prohíbe duplicar la lista completa de clientes aquí.
4. **Manejo de Estados de UI (Obligatorio):** 
   - Implementar un *Skeleton Loader* mientras la petición de la API está en curso.
   - Implementar un *Empty State* con un Call-to-Action ("Invitar Alumno") si la respuesta de la API es un array vacío.
5. **Navegación:** Asegurar que la clase `active` del nav para `clients` se mantenga encendida tanto en la lista como al entrar a la vista en detalle (`ClientRoutinesView`).
6. **Documentación:** Actualizar docs de arquitectura / data-flows reflejando el nuevo flujo hacia la ficha del cliente.

## Component map (Vue)

- **ClientsListView** (Smart) — Punto de entrada de la ruta: ejecuta la petición HTTP, maneja el estado reactivo (`loading`, `error`, `data`) y contiene la lógica de filtrado local.
- **ClientsList** (Dumb) — Solo recibe Props (la lista de clientes filtrada) y renderiza la UI. Emite el evento `select` hacia arriba.
- **TrainerDashboardView** — Hub principal reestructurado solo para métricas y accesos rápidos.
