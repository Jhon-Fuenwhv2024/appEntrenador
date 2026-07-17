# 039 · Ficha 360 Rediseñada del Alumno (Modo Entrenador)

**Estado:** implementado
**Depende de:** 006 (UI trainer rutinas), 020 (Perfil), 021 (Progreso), 026 (Body comp), 027 (Gráficas), 031–034
**Alimenta / consume:** 040 (badge membresía), 041 (chip PRs), 042 (score consistencia)

## Qué hace

Reorganiza la ficha del alumno (`/trainer/clients/:clientId`, hoy `ClientRoutinesView.vue`) en una experiencia tipo expediente 360: cabecera sticky de decisión + navegación por secciones (Resumen · Programación · Nutrición & Hábitos · Medidas · Check-ins · Gráficas · Chat). Reduce fricción cognitiva del entrenador sin perder funcionalidad existente.

## Criterios de aceptación

- [x] **Cabecera sticky:** Avatar, nombre, objetivo, último entrenamiento, slots para estado de membresía (040) y score de consistencia (042).
- [x] **Navegación por secciones:** Resumen | Programación | Nutrición & Hábitos | Medidas | Check-ins | Gráficas | Chat (deep-link opcional por sub-ruta o query/tab).
- [x] **Resumen:** Widgets de decisión (última sesión, check-in reciente, acceso rápido a programar / mensajes). PRs del mes cuando exista 041.
- [x] **Programación:** Editor de rutinas actual (días, ejercicios, superseries, plantillas) desacoplado del resto de paneles.
- [x] **Paneles existentes reubicados:** `NutritionTargetsPanel`, `DailyHabitsPanel`, `BodyCompositionPanel`, `CheckinsHistoryPanel`, `ProgressChartsPanel`, `ProfileFormCard`, historial de sesiones — sin pérdida de CRUD.
- [x] **Backend overview:** `GET /clients/:clientId/overview` agrega perfil + última sesión + conteos + último check-in + targets nutrición (+ membresía/consistencia cuando existan). Ownership: solo trainer dueño (`trainer_id`).
- [x] **Ruta canónica:** Mantener `/trainer/clients/:clientId` (bookmarks no se rompen).
- [x] **Mobile:** Tabs/segmentos horizontales con scroll; sin overflow; contraste ADR-0001.

## Fuera de alcance

- Analytics globales del trainer (home KPIs) — fuera de este roadmap.
- Implementación completa de membresía/PRs/rachas (solo slots / consumo de APIs cuando 040–042 existan).
- Rediseño del Modo Cliente — feature **038**.
