# 013 · Contraste UI + responsive mobile

**Estado:** implementada

## Qué hace

Corrige el contraste ilegible de CTAs cian/primary en tema oscuro (texto claro sobre `#00E5FF`) y garantiza que las vistas principales se vean y usen bien en móvil (≤600px / tablet), sin rediseñar el branding Trainfit ni tocar lógica/API/DB.

## Criterios de aceptación

- [x] Tokens `on-primary` / `on-success` definidos en el tema Vuetify dark
- [x] CTAs filled (Login, Registro, catálogo, rutinas, dashboard cliente, player) con texto legible sobre cian
- [x] Preferencia `color="primary"` frente a hex en botones filled
- [x] Vistas principales sin overflow horizontal relevante en viewport ~390px
- [x] Sin cambios de lógica de negocio, API o schema
- [x] `npm run build` frontend OK

## Fuera de alcance

- Tema light / toggle
- Cambio de hex de marca (`#00E5FF`)
- Kanban Obsidian
