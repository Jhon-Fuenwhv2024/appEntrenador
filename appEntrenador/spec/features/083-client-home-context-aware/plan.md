# 083 · Plan técnico

## Enfoque

1. Composable `useClientHomeMode` deriva modo desde bundle `/me/today` (sin config).
2. Ampliar `getTodayBundle` con consistency, check-in, chat, diet resumen, weekInsight.
3. Tabla `diet_meal_adherence` + PUT adherence bajo diet-plans (cliente).
4. UI: reestructura `ClientDashboardView` + `HomeDayActions` + dieta compacta + macros progreso.
5. Job digest semanal cliente en `notification-jobs` + mailer Resend.
6. Skills: vue-best-practices, express-mysql-backend, auth-roles-security.

## Archivos clave

| Capa | Path |
|------|------|
| Spec | `spec/features/083-client-home-context-aware/*` |
| Migración | `backend/db/migrations/034_diet_meal_adherence.sql` |
| Ensure | `backend/src/db/ensureDietMealAdherenceTable.js` |
| Bundle | `backend/src/modules/routines/routines.service.js` |
| Adherence API | `backend/src/modules/diet-plans/*` |
| Digest | `backend/src/modules/notification-jobs/*` + mail templates |
| FE composables | `useClientToday.js`, `useClientHomeMode.js` |
| FE UI | `ClientDashboardView.vue`, `HomeDayActions.vue`, `ClientDietView.vue`, `MacroSummaryCard.vue`, `ConsistencyRing.vue` |
| CSS | `src/assets/clientDashboard.css` |
| Docs | `docs/api.md`, `docs/data-flows.md` |

## Component map (Vue)

| Componente | Responsabilidad |
|------------|-----------------|
| `ClientDashboardView` | Orquesta shell + carga today + modos |
| `useClientHomeMode` | Deriva modo + copy hero |
| `HomeDayActions` | Chips glanceable agua / kcal / check-in / chat |
| `ClientDietView` (compact) | Próxima comida + expandir + Comí/No comí |
| `MacroSummaryCard` | Barras plan/eaten vs objetivo |
| `WeeklyCheckinDialog` | Reutilizado desde Inicio |

## Orden de fases

A UX → B bundle/chips → C adherence/macros → D digest → docs/validate
