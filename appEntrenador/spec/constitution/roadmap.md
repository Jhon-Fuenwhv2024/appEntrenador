# Roadmap

## Hecho

1. **Auth básica + invitaciones** — login, registro con token, roles `trainer` / `client`, listado de clientes (`GET /api/clients`). (Código legado previo a SDD; sin carpeta `features/` histórica.)
2. **001 · Modularizar auth y API compartida** — cliente Axios compartido, auth en `features/auth` y backend auth en `modules/auth`, sin cambiar el comportamiento visible.
3. **002 · Modularizar clientes y portal entrenador** — `GET /api/clients` en `modules/clients` y dashboard entrenador bajo `features/trainer`.
4. **003 · Auth JWT y middleware de roles** — login emite JWT; middleware `authenticate` / `requireRole`; Axios con Bearer token.
5. **004 · Ownership trainer↔cliente** — `trainer_id` en invitaciones y usuarios; listado de clientes filtrado por trainer autenticado.
6. **005 · API CRUD rutinas y ejercicios** — módulo `routines` con ownership y transacciones.
7. **006 · UI trainer de rutinas** — detalle de cliente y asignación de planes.
8. **007 · Portal cliente con rutinas reales** — dashboard cliente consumiendo `/me/routines`.
9. **008 · Catálogo de ejercicios (schema + seed)** — tabla `exercises` híbrida + seed local aplicado.
10. **009 · API/UI catálogo de ejercicios** — `GET/POST /exercises`, vista `/trainer/exercises` y combobox en rutinas.
11. **010 · Motor de ejecución de rutina** — composable `useWorkoutSession` (series, descanso, auto-avance).
12. **011 · Workout Player UI** — modo Comenzar mobile-first con media y registro de peso/reps.
13. **012 · Persistencia de sesión** — logs en DB + historial visible al trainer.
14. **013 · Contraste UI + responsive mobile** — tokens `on-primary`/`on-success`, CTAs legibles y pass mobile en vistas principales.
15. **014 · Mobile shell: bottom nav** — shell compartido, bottom nav ≤960px, logout en header móvil.
16. **015 · Dashboard trainer con datos reales** — stats/API reales; estado Activo/Sin plan; sin dietas.
17. **021 · Progreso / historial del cliente** — `GET /me/workout-sessions`, vista Mi progreso, historial pulido en ficha trainer.
18. **026 · Composición corporal del cliente** — historial antropométrico (peso, % grasa, IMC…); write solo trainer; client solo lectura.
19. **016 · IA de navegación trainer (shell)** — 4 slots; Ejercicios fuera de la barra.
20. **017 · Alumnos como destino propio** — `/trainer/clients`; Inicio como hub.
21. **018 · Plantillas de rutinas (Biblioteca)** — biblioteca reutilizable; asignar = copia.
22. **019 · Memoria de progresión** — último peso/reps desde logs (012).
23. **020 · Perfil alumno (`alumnos_info`)** — API + UI (schema ya existe).
24. **022 · Catálogo en Biblioteca + `exercise_id`** — vínculo estable línea↔catálogo.
25. **023 · Invitaciones: módulo + gestión** — `modules/invites`, listar/revocar.
26. **024 · Ajustes de cuenta** — nombre + cambio de password.
27. **025 · Notificaciones In-App** — Alerta al cliente de rutina actualizada, alerta al trainer de rutina completada.
28. **027 · Visualización de Progreso (Gráficas)** — Gráficas de peso, IMC y evolución de ejercicios clave.
29. **028 · Mejoras al Temporizador de Descanso** — Alerta sonora al finalizar, tiempo configurable por el entrenador.
30. **029 · Superseries y Circuitos** — Agrupar ejercicios (1A, 1B) para ejecutarlos sin descanso.
31. **031 · Módulo de Nutrición MVP** — Asignación de objetivos diarios de macros y calorías.
32. **032 · Seguimiento de Hábitos Diarios** — Checklist diario opcional (agua, sueño, pasos).
33. **033 · Fotos de Progreso y Check-in Semanal** — Subida de fotos mensuales y cuestionario de bienestar.
34. **034 · Mensajería Interna (Chat MVP)** — Chat directo entre entrenador y alumnos.
35. **037 · Motor SaaS B2B y Panel SuperAdmin** — Flag `is_superadmin`, planes FREE/PRO, `/backoffice`, paywall en invites (Fase 1; pagos automáticos fuera de alcance).
36. **038 · Rediseño Inmersivo del Modo Cliente** — Hero “Hoy: rutina” + CTA Empezar; misma piel en Player/Progreso. Spec: `038-client-mode-immersive-redesign`.
37. **039 · Ficha 360 Rediseñada del Alumno** — Expediente trainer (header sticky + secciones); `GET /clients/:id/overview`. Spec: `039-client-360-profile-redesign`.
38. **040 · Membresía y Control de Pago del Alumno** — Periodo, estado, días restantes visibles al cliente, soft-lock. Evoluciona **036**. Distinto de SaaS plataforma **037**. Spec: `040-client-membership-payments`.
39. **041 · Récords Personales (PRs) y Celebraciones** — Detección al cerrar sesión + overlay. Absorbe **030**. Spec: `041-personal-records-celebrations`.
40. **042 · Rachas y Score de Consistencia** — Racha + meta semanal + score 0–100 en Inicio y Ficha 360. Spec: `042-streaks-consistency-score`.

## Siguiente

1. **035 · Dashboard Analítico del Entrenador** — KPIs de negocio (ingresos estimados vía membresías 040, retención, actividad).

## Supersedidas (no implementar)

- **030 · Récords Personales (PRs) y Celebraciones** — absorbida por **041**.
- **036 · Gestión de Pagos / Control de Suscripciones** — absorbida por **040**.

## Backlog go-to-market y producto (043–052)

Orden sugerido tras cerrar Siguiente (041 → 042 → 035):

| ID | Feature | Por qué importa |
|----|---------|-----------------|
| **043** | Recuperación de contraseña + email SMTP + password en perfil cliente | Forgot-password; cliente cambia password en UI; SMTP para soporte |
| **044** | Caducidad / envío de invitaciones por email | Operativa real del trainer (hoy: copiar link) |
| **045** | Suite tests API/E2E críticos | Login, ownership, guardar sesión, soft-lock membresía |
| **046** | Deploy producción (Netlify FE + API + env) | Checklist deploy; `netlify.toml` sólido |
| **047** | Pagos SaaS automatizados (037 Fase 2) | Stripe/pasarela + portal facturación; FREE/PRO hoy es manual vía SuperAdmin |
| **048** | PWA + notificaciones push | Retención móvil; hoy solo in-app (025) |
| **049** | Informe semanal automático al trainer | Resumen alumnos (entrenos, rachas en riesgo, membresías por vencer) |
| **050** | Nutrición fase 2: registro diario de comida | 031 solo asigna macros; diario/adherencia |
| **051** | Comparador de fotos de progreso | 033 sube fotos; side-by-side / timeline visual |
| **052** | Exportar informe PDF del alumno | Valor alto para trainers que reportan a clientes |

Specs SDD: `spec/features/043-…` … `052-…`.

## Backlog técnico / nice-to-have (post-052)

- **Pinia / TypeScript** — solo si el estado o el tamaño del equipo lo justifican.
- Calendario / agendar sesiones 1:1
- Offline / cola de sets sin red
- Multi-idioma
- App nativa (explícitamente fuera de misión hoy)
- Leaderboards entre alumnos
- ERP / facturación fiscal completa

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.
> Fuente de verdad de avance: este archivo + `spec/features/*/tasks.md`. El doc `docs/features futuros.md` está obsoleto.
