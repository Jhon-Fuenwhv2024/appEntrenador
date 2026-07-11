# AGENTS.md — Trainfit

## Qué es este proyecto

Trainfit: plataforma web responsive para entrenadores personales
(gestión de clientes/rutinas) y portal para clientes (sus datos/rutinas).
Stack: Vue 3 + Vite + Vuetify (frontend), Express + MySQL (backend).

## Fuente de verdad

1. Este archivo (comportamiento del agente)
2. `spec/constitution/` (misión, stack, roadmap)
3. `spec/features/NNN-*/` (spec → plan → tasks de la feature en curso)
4. `docs/` (arquitectura, flujos, APIs y decisiones técnicas)
5. Skill: `.agents/skills/vue-best-practices/SKILL.md`

## Roles del agente (según la tarea)

| Rol | Cuándo | Enfoque |
|-----|--------|---------|
| Arquitecto | Estructura, specs, trade-offs | Plan primero; no código hasta acuerdo |
| Frontend / UI | `.vue`, router, Vuetify | Composition API; skill Vue obligatoria |
| Backend | `backend/`, APIs | Modules layered; validar inputs; auth |
| DBA | SQL, schema, migraciones | Actualizar `script_db.sql` + spec dominio |
| Security | Auth, roles, secrets | Nunca hardcodear secretos; no APIs abiertas |

## Flujo de trabajo obligatorio

1. Leer AGENTS.md + constitución relevante.
2. Si hay feature: leer `spec.md` / `plan.md` / `tasks.md`.
3. Vue: cargar skill `vue-best-practices` + refs core (reactivity, sfc, data-flow, composables).
4. Explorar código existente antes de proponer cambios.
5. Plan Mode / plan escrito si el cambio toca >2 módulos o auth/DB.
6. Implementar solo lo pedido; sin refactors colaterales.
7. Mantener documentación actualizada en `docs/` cuando cambien arquitectura, APIs, flujos de datos o decisiones técnicas.
8. Si se pide realizar o sugerir un commit, usar Conventional Commits (`feat: añade login de entrenador`, `fix: corrige validación de cliente`, `docs: actualiza arquitectura en docs/`).

## Reglas de modificación

### Puedes editar directamente cuando

- El usuario pidió implementar/arreglar algo concreto.
- El cambio está acotado a la feature/tarea acordada.
- Hay plan/tasks aprobados o instrucción explícita.

### Debes pedir permiso antes de

- Cambiar schema MySQL o borrar datos.
- Añadir dependencias npm.
- Refactors transversales (mover carpetas, Pinia, migrar a TS).
- Tocar auth/seguridad de forma amplia.
- Cambiar diseño visual global / tema Vuetify.
- Commits o push (solo si el usuario lo pide).

### Intocable / congelado sin orden explícita

- `.env*` y secretos (no commitear).
- `node_modules/`, lockfiles salvo justificación.
- Credenciales en producción.
- Features fuera de alcance de la tarea actual.
- Plantillas `spec/features/NNN-nombre-feature/` de ejemplo: reemplazar, no acumular basura.

## Gestión de documentación

- Es obligatorio mantener un registro riguroso de arquitectura, flujos de datos, APIs y decisiones técnicas.
- Toda documentación generada debe alojarse estrictamente dentro de `docs/`.
- No crear archivos de documentación sueltos (`.md`, `.txt`) fuera de `docs/`.
- Excepciones permitidas: `README.md` principal, `AGENTS.md` y los archivos SDD ya definidos en `spec/`.
- Cuando una implementación cambie contratos de API, estructura de carpetas, reglas de dominio o decisiones técnicas, actualizar `docs/` en la misma tarea.
- Usar nombres descriptivos dentro de `docs/`, por ejemplo `docs/architecture.md`, `docs/api.md`, `docs/data-flows.md` o `docs/decisions/ADR-0001-auth.md`.

## Skills y MCP

### vue-best-practices (OBLIGATORIA en trabajo Vue)

- Leer SKILL.md antes de cualquier cambio en `.vue`, router, composables, Pinia.
- Preferir Composition API + `<script setup>`.
- Mapear componentes antes de features no triviales.
- Carpetas por feature: `features/<nombre>/...`, `composables/useXxx`.

### Context7 (si está disponible)

- Usar para docs oficiales actualizadas (Vue, Express, mysql2, Vuetify).
- No sustituye leer el código del repo.
- Si Context7 no está conectado: usar código local + skill Vue + docs del proyecto.

### Otros MCP

- Browser: solo para verificar UI cuando se pida.
- No inventar servidores MCP no listados.

## Convenciones técnicas

- Frontend: JS + Vue SFC; Vuetify para UI; Axios vía `shared/api`.
- Backend: Express modular; SQL parametrizado; roles `trainer` | `client`.
- Auth: no confiar solo en `localStorage`; validar rol en servidor.
- Backend: devolver errores con formato JSON unificado, por ejemplo `{ success: false, error: "Mensaje", code: 400 }`.
- Frontend: capturar errores globalmente vía interceptors de Axios y mostrarlos con un sistema estándar de notificaciones.
- Logs: no ocultar errores con `console.log` vacíos ni `catch` silenciosos; registrar contexto útil sin exponer secretos.
- Idioma: español en producto/docs de negocio; código en inglés o español consistente con el archivo tocado.
- Responsive mobile-first.

## Arquitectura objetivo

Modular por features (capa ligera):

- Frontend: `src/app/`, `src/router/`, `src/shared/`, `src/features/{auth,trainer,client,routines}/`
- Backend: `backend/src/modules/{auth,clients,routines,invites}/` con routes → controller → service → queries; middleware de auth/roles

Migración gradual: no big-bang; mover código al adoptar cada feature.

## Anti-patrones

- Lógica de negocio pesada en componentes de vista.
- Endpoints sin auth "porque es local".
- Duplicar URLs de API en cada componente.
- Mocks permanentes cuando ya existe tabla en DB.
- Editar fuera del scope de la tarea.
