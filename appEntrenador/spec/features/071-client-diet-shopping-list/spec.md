# 071 · Lista de compra del plan nutricional

**Estado:** implementado  
**Depende de:** 043 (diet plans), 057 (jerarquía visual cliente), 064 (ciclo multi-semana)  
**Relacionada:** 070 (catálogo trainer — no requerido), 031 (nutrition targets)

## Qué hace

Permite al **cliente** ver una **lista de compra agregada** a partir de todo el plan nutricional activo (ciclo completo 2–4 semanas): alimentos consolidados por nombre + unidad, agrupados por macro dominante (Proteínas / Carbohidratos / Grasas / Otros), para saber qué comprar en el supermercado sin recorrer día a día.

## Decisiones de producto

- **Periodo:** todo el plan activo (todos los `diet_plan_days` con ítems), no solo la semana actual.
- **Sin tabla nueva:** la lista se deriva en lectura del plan activo.
- **Clasificación:** macro dominante por ítem (`protein_g` / `carbs_g` / `fats_g`); empate → P > C > G; los tres en 0 → grupo “Otros”.
- **Agregación:** misma clave = `normalize(food_name)` + `unit` (case-insensitive, trim); sumar `quantity` y macros.
- **Checklist comprado:** solo en cliente (localStorage por `planId`); no persistir en servidor en este MVP.
- **Ubicación UI:** botón carrito en el header de `ClientDietView` → ruta `/client/shopping-list` (`ClientShoppingListView`).

## Criterios de aceptación

### Backend

- [ ] `GET /api/me/diet-plan/shopping-list` (rol `client`, auth vía `req.user`)
- [ ] Resuelve el plan **activo** del cliente; si no hay plan → `{ success: true, data: null }` o empty con mensaje claro
- [ ] Recorre todos los días/meals/items del ciclo; agrega por `food_name` + `unit`
- [ ] Cada ítem incluye: `food_name`, `unit`, `quantity`, `calories`, `protein_g`, `carbs_g`, `fats_g`, `category` (`protein` | `carbs` | `fats` | `other`), `occurrences` (cuántas líneas se fusionaron)
- [ ] Respuesta agrupa por categoría: `{ plan: { id, title, cycle_length_weeks }, groups: [{ category, label, items[] }] }`
- [ ] Route → Controller → Service; SQL parametrizado; ownership del cliente

### Frontend — Cliente

- [ ] Componente lista de compra en dashboard (p. ej. `ClientShoppingListCard`) debajo o junto a `ClientDietView`
- [ ] Secciones: Proteínas, Carbohidratos, Grasas, Otros (ocultar grupo vacío)
- [ ] Cada fila: nombre, cantidad + unidad; opcional marcar comprado (checkbox / strikethrough)
- [ ] Empty state si no hay plan activo o no hay ítems
- [ ] Contraste ADR-0001 / accesibilidad visual; usable ~390px; clearance bottom-nav

### Docs / validación (en implementación)

- [ ] `docs/api.md` + `docs/data-flows.md` actualizados
- [ ] Build FE OK; smoke del endpoint con plan de ciclo multi-semana

## Fuera de alcance

- Catálogo 070 / secciones de supermercado reales (carnicería, nevera…)
- Conversión de unidades (g ↔ kg, taza ↔ g)
- Integración con supermercados / delivery
- Checklist persistente en DB o multi-dispositivo
- Lista de compra del entrenador / export PDF
- Registro de adherencia diaria (053)
