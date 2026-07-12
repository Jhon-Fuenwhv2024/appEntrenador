# AGENTS.md — Trainfit

## Qué es este proyecto

Trainfit: plataforma web responsive para entrenadores personales
(gestión de clientes/rutinas) y portal para clientes (sus datos/rutinas).
Stack: Vue 3 + Vite + Vuetify (frontend), Express + MySQL (backend).

## Fuente de verdad

1. Este archivo (comportamiento del agente)
2. `spec/constitution/` (misión, stack, roadmap)
3. `spec/features/NNN-*/` (spec → plan → tasks de la feature en curso) — **fuente técnica de ejecución**
4. `docs/` (arquitectura, flujos, APIs y decisiones técnicas)
5. Skills obligatorias en `.agents/skills/` (según el tipo de cambio):
   - `vue-best-practices`
   - `express-mysql-backend`
   - `auth-roles-security`

> **Macro vs micro:** el Kanban de Obsidian es mapa visual de alto nivel (macro). No es checklist de implementación. El checklist ejecutable vive en `spec/features/*/tasks.md` (micro).

## Roles del agente (según la tarea)

| Rol | Cuándo | Enfoque |
|-----|--------|---------|
| Arquitecto | Estructura, specs, trade-offs | Plan primero; no código hasta acuerdo |
| Frontend / UI | `.vue`, router, Vuetify | Composition API; skill Vue obligatoria |
| Backend | `backend/`, APIs | Route → Controller → Service; skill Express/MySQL obligatoria |
| DBA | SQL, schema, migraciones | Actualizar `script_db.sql` + spec dominio |
| Security | Auth, roles, secrets | Skill auth-roles obligatoria; nunca hardcodear secretos; no APIs abiertas |

## Flujo de trabajo obligatorio

1. Leer AGENTS.md + constitución relevante.
2. Si hay feature: leer `spec.md` / `plan.md` / `tasks.md` y usar `tasks.md` como checklist vivo (marcar progreso ahí).
3. Cargar la skill obligatoria según el tipo de cambio:
   - Vue / router / composables / Pinia → `vue-best-practices` + refs core (reactivity, sfc, data-flow, composables).
   - Backend Express / MySQL → `express-mysql-backend`.
   - Auth, sesiones, roles o protección de datos → `auth-roles-security` (además de backend si aplica).
4. Explorar código existente antes de proponer cambios.
5. Plan Mode / plan escrito si el cambio toca >2 módulos o auth/DB.
6. Implementar solo lo pedido; sin refactors colaterales.
7. Mantener documentación actualizada en `docs/` cuando cambien arquitectura, APIs, flujos de datos o decisiones técnicas.
8. Si se pide realizar o sugerir un commit, usar Conventional Commits (`feat: añade login de entrenador`, `fix: corrige validación de cliente`, `docs: actualiza arquitectura en docs/`).
9. Siempre validar las nuevas implementacion ejecutando build o npm run dev para el frontend y npm start en el backend, y comprobrar que funciona correctamente

### Macro vs micro (gestión de tareas)

- **Macro (Roadmap / Kanban Obsidian):** mapa visual de alto nivel del producto. **NO** actualizarlo ni modificarlo paso a paso durante el desarrollo. Evita redundancia con el trabajo técnico.
- **Micro (Ejecución):** la **única fuente de verdad técnica** para ejecutar código son las carpetas `spec/features/NNN-*/`. El archivo `tasks.md` de cada feature es el checklist que se sigue y se actualiza al completar tareas.

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
- Tablero Kanban de Obsidian (salvo orden explícita de actualizar el roadmap de alto nivel en `spec/constitution/roadmap.md` al **cerrar** una feature).

## Gestión de documentación

- Es obligatorio mantener un registro riguroso de arquitectura, flujos de datos, APIs y decisiones técnicas.
- Toda documentación generada debe alojarse estrictamente dentro de `docs/`.
- No crear archivos de documentación sueltos (`.md`, `.txt`) fuera de `docs/`.
- Excepciones permitidas: `README.md` principal, `AGENTS.md` y los archivos SDD ya definidos en `spec/`.
- Cuando una implementación cambie contratos de API, estructura de carpetas, reglas de dominio o decisiones técnicas, actualizar `docs/` en la misma tarea.
- Usar nombres descriptivos dentro de `docs/`, por ejemplo `docs/architecture.md`, `docs/api.md`, `docs/data-flows.md` o `docs/decisions/ADR-0001-auth.md`.

## Skills y MCP

### vue-best-practices (OBLIGATORIA en trabajo Vue)

- Ruta: `.agents/skills/vue-best-practices/SKILL.md`
- Leer SKILL.md antes de cualquier cambio en `.vue`, router, composables, Pinia.
- Preferir Composition API + `<script setup>`.
- Mapear componentes antes de features no triviales.
- Carpetas por feature: `features/<nombre>/...`, `composables/useXxx`.

### express-mysql-backend (OBLIGATORIA en trabajo backend)

- Ruta: `.agents/skills/express-mysql-backend/express-mysql-backend.md`
- Leer antes de cualquier cambio en `backend/`, rutas Express o consultas MySQL.
- Arquitectura obligatoria: **Route → Controller → Service** (sin SQL ni lógica de negocio en routes).
- SQL solo con prepared statements / parámetros; transacciones (`BEGIN` / `COMMIT` / `ROLLBACK`) cuando haya múltiples escrituras.
- Respuestas JSON estandarizadas (`success`, `data`/`error`, `message`/`code` según contrato del proyecto).

### auth-roles-security (OBLIGATORIA en auth / roles / datos sensibles)

- Ruta: `.agents/skills/auth-roles-security/SKILL.md`
- Leer antes de tocar autenticación, sesiones, roles o endpoints que expongan datos de usuario.
- Modelo asimétrico **Trainer vs Client**; permisos y superficies distintos.
- Aislamiento estricto por identidad: filtrar y autorizar con `req.user` (nunca confiar solo en el frontend).
- No hardcodear secretos; no dejar APIs sensibles abiertas “porque es local”.

### Context7 (si está disponible)

- Usar para docs oficiales actualizadas (Vue, Express, mysql2, Vuetify).
- No sustituye leer el código del repo ni las skills obligatorias.
- Si Context7 no está conectado: usar código local + skills aplicables + `docs/` del proyecto.

### Otros MCP

- Browser: solo para verificar UI cuando se pida.
- No inventar servidores MCP no listados.

## Convenciones técnicas

- Frontend: JS + Vue SFC; Vuetify para UI; Axios vía `shared/api`.
- Backend: Express modular; SQL parametrizado; roles `trainer` | `client`.
- Auth: no confiar solo en `localStorage`; validar rol y ownership en servidor vía `req.user`.
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
- Actualizar el Kanban de Obsidian como si fuera el checklist de implementación.
- SQL o lógica de negocio en archivos de rutas.
- Confiar en IDs enviados por el cliente sin contrastarlos con `req.user` / ownership.
