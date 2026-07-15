# 027 · Visualización de Progreso (Gráficas)

**Estado:** implementado
**Depende de:** 019 (Historial de ejercicios), 026 (Composición corporal)

## Qué hace
Proporciona gráficas visuales de líneas (Time-Series) para que el cliente y el entrenador analicen la evolución del peso corporal, IMC y rendimiento en ejercicios específicos.

## Criterios de Aceptación

- [x] **Librería estricta:** Instalar y usar `chart.js` y `vue-chartjs`. NO usar ApexCharts ni ECharts.
- [x] **Backend (Endpoints):** 
      - `GET /api/progress/metrics/:clientId` -> Devuelve historial de peso e IMC ordenado cronológicamente.
      - `GET /api/progress/exercises/:clientId` -> Devuelve evolución del peso máximo levantado por ejercicio.
- [x] **UI Cliente:** Pestaña "Gráficas" en la vista de "Mi Progreso".
- [x] **UI Trainer:** Pestaña o botón de "Ver Gráficas" en la ficha del alumno.
- [x] **UX / Edge Cases:** Si no hay datos suficientes (menos de 2 registros), mostrar un mensaje amigable ("No hay datos suficientes para graficar") en lugar de un canvas vacío.
- [x] **Responsividad:** Las gráficas deben adaptarse al ancho del dispositivo móvil sin desbordarse (mantener `maintainAspectRatio: false` configurado correctamente en Vue).

## Fuera de alcance
- Gráficas de pastel (Pie charts) para macros.
- Exportación de las gráficas a PDF/Imagen.