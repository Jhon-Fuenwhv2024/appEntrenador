# 001 · Modularizar auth y API compartida

**Estado:** implementada; pendiente validación local manual

## Qué hace

El producto se comporta igual para el usuario (login, registro por invitación, dashboards), pero el código de autenticación y las llamadas HTTP quedan organizados de forma modular: un cliente API único en el frontend y módulos `auth` claros en frontend y backend.

## Por qué

Hoy las URLs de la API están duplicadas en componentes, auth está repartido sin carpeta de feature, y parte del backend (`/api/clients`) vive inline en `server.js`. Esta base es el primer paso de la arquitectura modular acordada y reduce deuda antes de JWT, clientes o rutinas.

## Criterios de aceptación

- [ ] Existe un cliente Axios compartido (p. ej. `src/shared/api/`) usado por login/registro (y trainer donde aplique) en lugar de URLs hardcodeadas repetidas en cada componente.
- [ ] Los componentes/vistas de login y registro viven bajo `src/features/auth/` (o rutas equivalentes documentadas), importados desde el router sin romper `/` y `/registro`.
- [ ] El backend expone auth desde `backend/src/modules/auth/` (routes → controller → service o estructura equivalente), montado desde `server.js`.
- [ ] Login, registro con token e invitación (`generate-token`) siguen funcionando como antes.
- [ ] No se cambia el schema MySQL ni se añade JWT en esta feature.
- [ ] `spec/constitution/roadmap.md` refleja el estado al cerrar la feature.

## Fuera de alcance

- Middleware JWT / sesiones server-side (backlog).
- Modularizar `modules/clients` de forma completa (puede dejarse un stub o tarea mínima si `/api/clients` se mueve solo lo necesario; el CRUD/listado profundo es otra feature).
- CRUD de rutinas/ejercicios.
- Migración a TypeScript o Pinia.
- Rediseño visual de Vuetify.
