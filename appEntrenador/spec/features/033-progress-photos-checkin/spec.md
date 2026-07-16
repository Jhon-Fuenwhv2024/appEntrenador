# 033 · Check-in Semanal y Fotos de Progreso

**Estado:** implementado
**Depende de:** 020 (Perfil)

## Qué hace
Crea un canal estructurado de feedback entre cliente y entrenador. Permite al cliente realizar un reporte semanal de muy baja fricción (biofeedback) y, de manera estrictamente opcional, subir fotos de su físico para comparar su evolución.

## Criterios de Aceptación (Check-in Semanal - Baja Fricción)
- [ ] **Base de Datos (`weekly_checkins`):** `id`, `client_id` (FK), `created_at` (DATE), `sleep_quality` (INT 1-5), `stress_level` (INT 1-5), `diet_adherence` (INT 1-5), `notes` (TEXT nullable).
- [ ] **UI Cliente:** Un formulario rápido (tipo modal o tarjeta) con sliders o selectores de 5 niveles (estrellas o emojis) para las métricas, y un campo de texto opcional para comentarios.
- [ ] **UI Entrenador:** Una vista dentro del perfil del alumno para leer el historial de check-ins cronológicamente e identificar si el alumno está estresado o no duerme bien (para ajustar la rutina).

## Criterios de Aceptación (Fotos de Progreso - Opcionales)
- [ ] **Privacidad y UX:** La subida de fotos debe estar claramente separada y marcada como opcional. Un cliente puede enviar su check-in semanal sin subir una sola foto.
- [ ] **Base de Datos (`progress_photos`):** `id`, `client_id` (FK), `checkin_id` (FK opcional), `image_url` (VARCHAR), `pose_type` (ENUM: 'front', 'side', 'back'), `taken_at` (DATE).
- [ ] **UI Cliente:** Botón "Añadir fotos de progreso (Opcional)". Permite subir hasta 3 imágenes.
- [ ] **UI Entrenador:** Galería de imágenes filtrable por pose en el perfil del cliente.

## Fuera de alcance
- Cuestionarios dinámicos o editables por el entrenador (las preguntas son fijas para el MVP).
- Filtros o recortes de imagen en el navegador.