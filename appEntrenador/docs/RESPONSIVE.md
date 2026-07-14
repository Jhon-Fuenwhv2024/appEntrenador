- [x] `[013]` **Optimización Responsive + contraste (Mobile-Friendly)**
  **Descripción:** Garantizar que las vistas principales (Login, Dashboards, catálogo, rutinas, player) se visualicen correctamente en dispositivos móviles y que los CTAs primary tengan contraste legible.
  **Requisitos Técnicos (Agente):**
  - **Tema:** `on-primary` / `on-success` en `src/plugin/vuetify.js` (`#0B0D12`).
  - **Framework:** sistema de Grid de Vuetify + CSS de dashboards existentes.
  - **Restricción:** Cero cambios de lógica de negocio/API. Ajustes de template/estilos y tokens de tema.
  - **Detalle:** ver `spec/features/013-ui-contrast-responsive/` y `docs/decisions/ADR-0001-contrast-on-primary.md`.

- [x] `[014]` **Mobile shell: bottom nav + alumnos arriba**
  **Descripción:** Shell autenticado compartido con bottom navigation en ≤960px, logout en header móvil, y panel Mis Alumnos arriba del gráfico en el dashboard del trainer.
  **Requisitos Técnicos (Agente):**
  - **Layout:** `src/shared/layout/AppShell.vue` + `AppBottomNav.vue` + `src/assets/appShell.css`.
  - **Breakpoints:** sidebar desktop; bottom nav + safe-area en ≤960px; stats 2×2; profile solo avatar ≤600px.
  - **Restricción:** Sin cambios API/DB. Workout Player sin bottom nav.
  - **Detalle:** ver `spec/features/014-mobile-shell-bottom-nav/`.

- [x] `[016]` **IA de navegación trainer (shell)**
  **Descripción:** Cuatro destinos estables en sidebar y bottom nav (Inicio, Alumnos, Biblioteca, Ajustes). Catálogo de ejercicios fuera de la barra (herramienta de Biblioteca). Placeholders seguros para rutas nuevas.
  **Requisitos Técnicos (Agente):**
  - **Slots trainer:** `/dashboard`, `/trainer/clients`, `/trainer/library`, `/trainer/settings`.
  - **Active state:** ficha `/trainer/clients/:clientId` → Alumnos; `/trainer/exercises` → Biblioteca.
  - **Logout:** fuera de los 4 slots (header móvil / pie sidebar).
  - **Restricción:** Sin producto de dominio nuevo; client sin cambios de IA.
  - **Detalle:** ver `spec/features/016-trainer-nav-ia/`.

- [x] `[017]` **Alumnos como destino propio**
  **Descripción:** Lista dedicada en `/trainer/clients` (búsqueda local, estado Activo/Sin plan, entrada a ficha). Inicio queda como hub (métricas, invitación, CTA).
  **Requisitos Técnicos (Agente):**
  - **Vista:** `ClientsListView` + `ClientsList` (filtro `computed` local; sin `?q` en API).
  - **Hub:** `TrainerDashboardView` sin lista completa; CTA “Mis alumnos”.
  - **Detalle:** ver `spec/features/017-trainer-clients-destination/`.
