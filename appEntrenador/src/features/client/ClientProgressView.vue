<script setup>
/**
 * Client "Mi progreso" — single scroll ordenado (Feature 072).
 * Orden: Resumen → Tendencias → Sesiones → Logros → Composición → Historial.
 */
import { computed, defineAsyncComponent, onMounted, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import SessionHeaderActions from '../../shared/layout/SessionHeaderActions.vue';
import { getMyWorkoutSessions } from './api/workoutSessionsApi.js';
import { getMyBodyComposition } from './api/bodyCompositionApi.js';
import BodyCompositionReadOnly from './components/BodyCompositionReadOnly.vue';
import PersonalRecordsSection from './components/PersonalRecordsSection.vue';
import ProgressActivityBars from './components/ProgressActivityBars.vue';
import ProgressHeroCard from './components/ProgressHeroCard.vue';
import ProgressSmartHistory from './components/ProgressSmartHistory.vue';
import WeeklyCheckinDialog from './components/WeeklyCheckinDialog.vue';
import { getMyConsistency } from './api/consistencyApi.js';
import { useProgressSessions } from './composables/useProgressSessions.js';
import {
  PROGRESS_RANGE_OPTIONS,
  useProgressRange,
  weeksForRange,
} from './composables/useProgressRange.js';

const ProgressChartsPanel = defineAsyncComponent(() => (
  import('../../shared/components/ProgressChartsPanel.vue')
));

const router = useRouter();

const loading = shallowRef(true);
const loadError = shallowRef('');
const sessions = shallowRef([]);
const clientId = shallowRef(null);
const checkinDialogOpen = shallowRef(false);
const snackbar = ref(false);
const snackbarText = shallowRef('');
const snackbarColor = shallowRef('success');
const bestStreak = shallowRef(0);
const apiCurrentStreak = shallowRef(null);
const bodyLogs = shallowRef([]);

const { rangeDays, setRangeDays } = useProgressRange(30);

const {
  completedCount,
  currentStreak: derivedStreak,
  sessionsLast7Days,
  buildWeeklyActivity,
  recentSessions,
  sessionsByMonth,
} = useProgressSessions(sessions);

const currentStreak = computed(() => (
  apiCurrentStreak.value != null ? apiCurrentStreak.value : derivedStreak.value
));

const activityWeeks = computed(() => buildWeeklyActivity(weeksForRange(rangeDays.value)));

const activityHint = computed(() => (
  `Sesiones completadas · últimas ${weeksForRange(rangeDays.value)} semanas`
));

const progressSections = [
  { id: 'progress-resumen', label: 'Resumen' },
  { id: 'progress-tendencias', label: 'Tendencias' },
  { id: 'progress-sesiones', label: 'Sesiones' },
  { id: 'progress-logros', label: 'Logros' },
  { id: 'progress-composicion', label: 'Composición' },
  { id: 'progress-historial', label: 'Historial' },
];

/**
 * Salta a la sección en su sitio del scroll (no sustituye contenido en el mismo panel).
 * El overflow real está en `.main-content`, no en window.
 */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const scroller = el.closest('.main-content');
  if (!scroller) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const nav = scroller.querySelector('.progress-nav');
  const navOffset = nav ? nav.getBoundingClientRect().height + 8 : 8;
  const top = el.getBoundingClientRect().top
    - scroller.getBoundingClientRect().top
    + scroller.scrollTop
    - navOffset;

  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

function openCheckinDialog() {
  checkinDialogOpen.value = true;
}

function onCheckinSubmitted() {
  snackbarText.value = 'Check-in enviado. ¡Gracias!';
  snackbarColor.value = 'success';
  snackbar.value = true;
}

function onCheckinError(message) {
  snackbarText.value = message || 'No se pudo enviar el check-in';
  snackbarColor.value = 'error';
  snackbar.value = true;
}

async function loadSessions() {
  try {
    loading.value = true;
    loadError.value = '';
    const response = await getMyWorkoutSessions();
    sessions.value = response.data.data ?? [];
  } catch (error) {
    console.error('Error cargando progreso del cliente:', error);
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar tu progreso');
    sessions.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadConsistency() {
  try {
    const response = await getMyConsistency();
    const data = response.data?.data;
    if (!data) return;
    apiCurrentStreak.value = Number(data.current_streak) || 0;
    bestStreak.value = Number(data.best_streak) || 0;
  } catch (error) {
    console.error('Error cargando consistencia en progreso:', error);
  }
}

async function loadBodyLogs() {
  try {
    const response = await getMyBodyComposition();
    bodyLogs.value = response.data?.data ?? [];
  } catch (error) {
    console.error('Error cargando peso para hero de progreso:', error);
    bodyLogs.value = [];
  }
}

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'client') {
    router.push('/dashboard');
    return;
  }
  clientId.value = user.id;
  loadSessions();
  loadConsistency();
  loadBodyLogs();
});
</script>

<template>
  <AppShell role="client" active="progress">
    <main class="main-content flex-grow-1 overflow-y-auto">
      <header class="dashboard-header progress-header">
        <div class="header-left">
          <p class="header-date mb-1">
            <v-icon icon="mdi-chart-timeline-variant" size="14" class="mr-1" />
            Seguimiento
          </p>
          <h1 class="header-title">Mi progreso</h1>
        </div>
        <div class="header-right progress-header__actions">
          <SessionHeaderActions role="client" />
        </div>
      </header>

      <div class="progress-body">
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-3"
          height="2"
        />

        <v-alert
          v-else-if="loadError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ loadError }}
          <template #append>
            <v-btn variant="text" size="x-small" @click="loadSessions">Reintentar</v-btn>
          </template>
        </v-alert>

        <div class="progress-scroll">
          <nav class="progress-nav" aria-label="Secciones de progreso">
            <button
              v-for="section in progressSections"
              :key="section.id"
              type="button"
              class="progress-nav__chip"
              :aria-label="`Ir a ${section.label}`"
              @click="scrollToSection(section.id)"
            >
              {{ section.label }}
            </button>
          </nav>

          <section id="progress-resumen" class="progress-section mb-3">
            <ProgressHeroCard
              :loading="loading"
              :current-streak="currentStreak"
              :best-streak="bestStreak"
              :sessions-last7-days="sessionsLast7Days"
              :body-logs="bodyLogs"
              @checkin="openCheckinDialog"
            />
          </section>

          <section
            id="progress-tendencias"
            class="progress-section mb-3"
            aria-labelledby="progress-trends-title"
          >
            <div class="progress-section__head">
              <h2 id="progress-trends-title" class="progress-section__title">Tendencias</h2>
              <p class="progress-section__hint">Peso, fuerza y actividad en el rango elegido</p>
            </div>

            <div
              class="progress-range"
              role="group"
              aria-label="Rango de tendencias"
            >
              <button
                v-for="opt in PROGRESS_RANGE_OPTIONS"
                :key="opt.value"
                type="button"
                class="progress-range__chip"
                :class="{ 'progress-range__chip--active': rangeDays === opt.value }"
                :aria-pressed="rangeDays === opt.value"
                :aria-label="`Tendencias últimos ${opt.label}`"
                @click="setRangeDays(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>

            <ProgressActivityBars
              class="mb-3"
              :loading="loading"
              :weeks="activityWeeks"
              :hint="activityHint"
            />

            <ProgressChartsPanel
              v-if="clientId"
              :client-id="clientId"
              :sessions="sessions"
              :range-days="rangeDays"
              hide-activity
            />

            <v-alert
              v-if="!loading && !loadError && completedCount === 0 && bodyLogs.length < 2"
              type="info"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              Entrena y registra peso para ver tu evolución
            </v-alert>
          </section>

          <section
            v-if="!loading && !loadError"
            id="progress-sesiones"
            class="progress-section mb-3"
            aria-labelledby="progress-sessions-title"
          >
            <div class="progress-section__head">
              <h2 id="progress-sessions-title" class="progress-section__title">Sesiones</h2>
              <p class="progress-section__hint">Últimos entrenamientos</p>
            </div>
            <ProgressSmartHistory
              hide-head
              title="Sesiones"
              hint="Últimas 5"
              :recent-sessions="recentSessions"
              :sessions-by-month="[]"
              :show-recent="true"
              :show-by-month="false"
              empty-text="Sin entrenamientos aún. Completa una rutina desde Inicio."
            />
          </section>

          <section
            id="progress-logros"
            class="progress-section mb-3"
            aria-labelledby="progress-achievements-title"
          >
            <div class="progress-section__head">
              <h2 id="progress-achievements-title" class="progress-section__title">Logros</h2>
              <p class="progress-section__hint">Récords personales de peso</p>
            </div>
            <PersonalRecordsSection />
          </section>

          <section
            id="progress-composicion"
            class="progress-section mb-3"
            aria-labelledby="progress-body-title"
          >
            <div class="progress-section__head">
              <h2 id="progress-body-title" class="progress-section__title">Composición corporal</h2>
              <p class="progress-section__hint">Solo lectura · registra tu entrenador</p>
            </div>
            <BodyCompositionReadOnly embedded hide-head />
          </section>

          <section
            v-if="!loading && !loadError"
            id="progress-historial"
            class="progress-section mb-3"
            aria-labelledby="progress-history-title"
          >
            <div class="progress-section__head">
              <h2 id="progress-history-title" class="progress-section__title">Historial</h2>
              <p class="progress-section__hint">Sesiones anteriores por mes</p>
            </div>
            <ProgressSmartHistory
              hide-head
              title="Historial"
              hint="Por mes"
              :recent-sessions="[]"
              :sessions-by-month="sessionsByMonth"
              :show-recent="false"
              :show-by-month="true"
              empty-text="Aún no hay historial mensual. Sigue entrenando."
            />
          </section>
        </div>
      </div>
    </main>

    <WeeklyCheckinDialog
      v-model="checkinDialogOpen"
      @submitted="onCheckinSubmitted"
      @error="onCheckinError"
    />

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3500">
      {{ snackbarText }}
    </v-snackbar>
  </AppShell>
</template>

<style src="../../assets/clientDashboard.css" scoped></style>

<style scoped>
.progress-header .header-left {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.progress-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-body {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 0.5rem 0.15rem 1.25rem;
}

@media (min-width: 960px) {
  .progress-body {
    max-width: 720px;
    padding: 0.5rem 0.5rem 1.5rem;
  }
}

.progress-scroll {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.progress-nav {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  margin: 0 -0.15rem 0.85rem;
  padding: 0.35rem 0.15rem 0.5rem;
  background: linear-gradient(
    180deg,
    rgb(var(--v-theme-background)) 70%,
    rgba(11, 13, 18, 0.85) 100%
  );
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.progress-nav__chip {
  flex: 0 0 auto;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--tf-on-surface, #fff);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.progress-nav__chip:hover {
  background: rgba(0, 229, 255, 0.1);
  border-color: rgba(0, 229, 255, 0.35);
}

.progress-nav__chip:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.progress-section {
  scroll-margin-top: 56px;
}

.progress-section__head {
  margin-bottom: 0.65rem;
}

.progress-section__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--tf-on-surface, #fff);
}

.progress-section__hint {
  margin: 2px 0 0;
  font-size: 0.72rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.progress-range {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 0.75rem;
}

.progress-range__chip {
  min-height: 44px;
  min-width: 72px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: var(--tf-on-surface, #fff);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.progress-range__chip:hover {
  background: rgba(0, 229, 255, 0.1);
  border-color: rgba(0, 229, 255, 0.35);
}

.progress-range__chip:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.progress-range__chip--active {
  background: rgba(0, 229, 255, 0.16);
  border-color: rgba(0, 229, 255, 0.55);
  color: rgb(var(--v-theme-primary));
}
</style>
