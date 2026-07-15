# 029 · Superseries y Circuitos

**Estado:** implementado
**Depende de:** 018 (Plantillas), 028 (Temporizador)

## Qué hace
Permite agrupar dos o más ejercicios en "Superseries" o "Circuitos" usando un identificador de letra (Ej. A, B, C). En el Workout Player, los ejercicios agrupados se ejecutan de forma intercalada y el descanso solo se activa al finalizar la última serie del grupo.

## Criterios de Aceptación
- [x] **Base de Datos:** Añadir columna `superset_letter` (VARCHAR(2), nullable) a `ejercicios` y `template_exercises`.
- [x] **UI Trainer (Creador de Rutinas):** 
      - Añadir un pequeño input o selector opcional junto a cada ejercicio llamado "Grupo/Superserie" (valores: A, B, C, etc., o vacío).
      - Visualmente, los ejercicios con la misma letra deben verse agrupados (ej. un borde lateral del mismo color).
- [x] **UI Cliente (Workout Player):** 
      - Los ejercicios de una misma letra se renderizan juntos dentro de una misma tarjeta o contenedor visual.
      - **Lógica de Ejecución (CRÍTICO):** El cliente marca la Serie 1 del Ejercicio A. NO hay descanso. Marca la Serie 1 del Ejercicio B. Al ser el último del grupo 'A', **AQUÍ se dispara el temporizador de la Feature 028**.
- [x] **Ordenamiento:** El backend respeta el orden de inserción (`id ASC` en rutinas; `sort_order` en plantillas). La agrupación en player es por letra **adyacente**.

## Fuera de alcance
- Lógica de "Drop sets" (Series descendentes con reducción de peso).
- Validaciones complejas que impidan al entrenador agrupar ejercicios no contiguos (asumimos que el entrenador los ordenará correctamente).