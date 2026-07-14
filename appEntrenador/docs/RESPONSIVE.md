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
