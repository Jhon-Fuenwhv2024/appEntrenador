<script setup>
/**
 * Client "Mi progreso" — KPIs + actividad visual + historial inteligente + gráficas.
 */
import { defineAsyncComponent, onMounted, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import { getMyWorkoutSessions } from './api/workoutSessionsApi.js';
import BodyCompositionReadOnly from './components/BodyCompositionReadOnly.vue';
import ProgressActivityBars from './components/ProgressActivityBars.vue';
import ProgressKpiStrip from './components/ProgressKpiStrip.vue';
import ProgressSmartHistory from './components/ProgressSmartHistory.vue';
import WeeklyCheckinDialog from './components/WeeklyCheckinDialog.vue';
import { useProgressSessions } from './composables/useProgressSessions.js';

const ProgressChartsPanel = defineAsyncComponent(() => (
  import('../../shared/components/ProgressChartsPanel.vue')
));

const router = useRouter();

const loading = shallowRef(true);
const loadError = shallowRef('');
const sessions = shallowRef([]);
const activeTab = shallowRef('resumen');
const clientId = shallowRef(null);
const checkinDialogOpen = shallowRef(false);
const snackbar = ref(false);
const snackbarText = shallowRef('');
const snackbarColor = shallowRef('success');

const {
  totalSessions,
  completedCount,
  currentStreak,
  sessionsLast7Days,
  weeklyActivity,
  recentSessions,
  sessionsByMonth,
} = useProgressSessions(sessions);

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

function handleLogout() {
  clearSession();
  router.push('/');
}

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'client') {
    router.push('/dashboard');
    return;
  }
  clientId.value = user.id;
  loadSessions();
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
          <button
            type="button"
            class="progress-checkin-header-btn"
            title="Check-in semanal"
            @click="openCheckinDialog"
          >
            <v-icon icon="mdi-clipboard-check-outline" size="16" />
            <span>Check-in</span>
          </button>
          <button
            type="button"
            class="header-logout-btn"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            @click="handleLogout"
          >
            <v-icon icon="mdi-logout-variant" size="20" />
          </button>
        </div>
      </header>

      <div class="progress-body">
        <v-tabs
          v-model="activeTab"
          color="primary"
          density="compact"
          class="progress-tabs mb-3"
        >
          <v-tab value="resumen">Resumen</v-tab>
          <v-tab value="graficas">Gráficas</v-tab>
        </v-tabs>

        <div v-if="activeTab === 'resumen'" class="progress-resumen">
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

          <ProgressKpiStrip
            class="mb-3"
            :loading="loading"
            :total-sessions="totalSessions"
            :completed-count="completedCount"
            :current-streak="currentStreak"
            :sessions-last7-days="sessionsLast7Days"
          />

          <ProgressActivityBars
            class="mb-3"
            :loading="loading"
            :weeks="weeklyActivity"
          />

          <ProgressSmartHistory
            v-if="!loading && !loadError"
            class="mb-3"
            :recent-sessions="recentSessions"
            :sessions-by-month="sessionsByMonth"
          />

          <section class="progress-panel progress-panel--body">
            <BodyCompositionReadOnly embedded />
          </section>
        </div>

        <ProgressChartsPanel
          v-else-if="clientId"
          :client-id="clientId"
          :sessions="sessions"
        />
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

.progress-checkin-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 36px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.12);
  color: #00e5ff;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.progress-checkin-header-btn:hover {
  background: rgba(0, 229, 255, 0.18);
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

.progress-tabs {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.progress-resumen {
  display: flex;
  flex-direction: column;
}

.progress-panel--body {
  padding: 0;
  background: transparent;
  border: 0;
}
</style>
