# 035 · Dashboard Analítico del Entrenador

**Estado:** completada (Epic Fitness Fase 1)
**Depende de:** 015 (dashboard con datos reales), 033 (check-ins semanales), 031 (macros; dietas por asignar hasta 043)
**Relacionada:** 040 (membresías — ingresos estimados opcional), 042 (consistencia)

## Qué hace

Transforma el Inicio del entrenador en un **panel de control gerencial**: retención (activos vs inactivos), cola de tareas pendientes y progreso agregado de la semana. Sustituye/enriquece las métricas básicas de 015.

## Criterios de aceptación

### Métricas clave

- [x] **Alumnos activos vs inactivos (retención):**
  - Definición documentada (ej. activo = ≥1 sesión finished en los últimos N días, o membresía al día; inactivo = resto de clientes del trainer).
  - Contadores + tasa de retención % (`activos / total * 100`).
- [x] **Tareas pendientes:**
  - Check-ins semanales sin revisar (fuente: `weekly_checkins` / 033).
  - Dietas por asignar: clientes sin plan de dieta activo (043) o, mientras 043 no exista, sin `nutrition_targets` (031).
  - Totales agregados visibles en tarjeta(s); enlaces/atajos opcionales a la cola.
- [x] **Progreso general de la semana:**
  - Sesiones completadas esta semana (ISO o semana local documentada).
  - Comparación ligera vs meta o vs semana anterior si los datos lo permiten.
  - Serie diaria o semanal apta para gráfico ligero en FE.

### Backend

- [x] Extender `GET /api/trainer/dashboard` (o sub-recurso documentado) para devolver las métricas agregadas en **pocas queries set-based** (sin N+1 por cliente).
- [x] Rol: solo `trainer`; filtrar siempre por `req.user.id`.
- [x] Contrato JSON documentado en `docs/api.md` (campos: `retention`, `pendingTasks`, `weekProgress`, más lo ya existente de 015 si se mantiene).

### Frontend

- [x] Layout grid responsive con `v-card` (Vuetify) en `TrainerDashboardView`.
- [x] Componentes de KPI (ej. `StatCard` / tarjetas de retención y pendientes).
- [x] Gráfico ligero de progreso semanal (reutilizar patrón de charts del proyecto si existe).
- [x] Contraste Trainfit: CTAs `color="primary"`, menús con `tf-overlay-menu` si aplica.

## Fuera de alcance

- Informe semanal automático por email/push (backlog informe trainer).
- CRUD de dietas (043) o registro diario de comida.
- Panel SuperAdmin / métricas SaaS (037).
