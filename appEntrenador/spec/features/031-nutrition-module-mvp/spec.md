# 031 · Módulo de Nutrición MVP (Macros y Calorías)

**Estado:** en progreso
**Depende de:** 020 (Ficha/Perfil del alumno)

## Qué hace
Permite al entrenador establecer un objetivo nutricional diario fijo (macros y calorías) para su cliente. El cliente visualizará esta meta estática en su panel principal para usarla como referencia diaria.

## Criterios de Aceptación

- [x] **Base de Datos:** 
      - Tabla `nutrition_targets` (MVP: 1 a 1 con el cliente o tabla de historial donde se lee la última fila).
      - Campos: `client_id` (FK), `trainer_id` (FK), `calories` (INT), `protein_g` (INT), `carbs_g` (INT), `fats_g` (INT), `updated_at`.
- [x] **Regla de Negocio (Cálculo):** 
      - Las calorías totales deben coincidir o estar muy cerca de la suma de macros: (Proteína * 4) + (Carbs * 4) + (Grasas * 9).
- [x] **UI Trainer (Escritura):**
      - Formulario en la ficha del alumno para asignar o editar estos valores.
      - **UX/UI:** Al escribir los gramos de los macros, el campo de Calorías debe calcularse y actualizarse automáticamente de forma reactiva para ayudar al entrenador.
- [x] **UI Cliente (Solo Lectura):**
      - Tarjeta resumen (Card) en el Dashboard / "Mi Progreso".
      - Mostrar visualmente el desglose (ej. pequeños progress bars estáticos o gráficos de anillos simples usando CSS/SVG básico) con los gramos de cada macro y las calorías totales.

## Fuera de alcance
- Seguimiento diario (logging) de comidas por parte del cliente.
- Base de datos de alimentos o escáner de códigos de barras.
- Gráficas evolutivas de nutrición.