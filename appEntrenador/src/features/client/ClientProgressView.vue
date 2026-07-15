<script setup>
/**
 * Client "Mi progreso" — layout ancho: entrenamientos + composición corporal.
 */
import { computed, onMounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import WorkoutSessionHistoryList from '../../shared/components/WorkoutSessionHistoryList.vue';
import { getMyWorkoutSessions } from './api/workoutSessionsApi.js';
import BodyCompositionReadOnly from './components/BodyCompositionReadOnly.vue';

const router = useRouter();

const loading = shallowRef(true);
const loadError = shallowRef('');
const sessions = shallowRef([]);

const completedCount = computed(() => (
  sessions.value.filter((s) => s.status === 'completed').length
));

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
  loadSessions();
});
</script>

<template>
  <AppShell role="client" active="progress">
    <main class="main-content flex-grow-1 overflow-y-auto">
      <header class="dashboard-header progress-header">
        <div class="header-left">
          <h1 class="header-title">Mi progreso</h1>
          <div class="progress-inline-stats" aria-label="Resumen">
            <span class="progress-inline-stats__item">
              <strong>{{ loading ? '—' : sessions.length }}</strong> sesiones
            </span>
            <span class="progress-inline-stats__dot" aria-hidden="true">·</span>
            <span class="progress-inline-stats__item">
              <strong>{{ loading ? '—' : completedCount }}</strong> completadas
            </span>
          </div>
        </div>
        <div class="header-right">
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

        <div class="progress-grid">
          <section class="progress-panel">
            <div class="progress-panel__head">
              <h2 class="progress-panel__title">Entrenamientos</h2>
              <span class="progress-panel__hint">Toca para ver series</span>
            </div>
            <WorkoutSessionHistoryList
              v-if="!loading && !loadError"
              :sessions="sessions"
              compact
              empty-text="Sin entrenamientos aún. Completa una rutina desde Inicio."
            />
            <p v-else-if="loading" class="progress-panel__placeholder">Cargando…</p>
          </section>

          <section class="progress-panel progress-panel--body">
            <BodyCompositionReadOnly embedded />
          </section>
        </div>
      </div>
    </main>
  </AppShell>
</template>

<style src="../../assets/clientDashboard.css" scoped></style>

<style scoped>
.progress-header .header-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.progress-inline-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #8b929e;
}

.progress-inline-stats strong {
  color: #00e5ff;
  font-weight: 700;
}

.progress-inline-stats__dot {
  opacity: 0.5;
}

.progress-body {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0.75rem 1rem 1.25rem;
}

@media (min-width: 960px) {
  .progress-body {
    padding: 0.5rem 1.5rem 1.5rem;
  }
}

.progress-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
  align-items: start;
}

@media (min-width: 900px) {
  .progress-grid {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 1rem;
  }
}

.progress-panel {
  padding: 0.85rem 0.9rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  min-height: 0;
}

.progress-panel__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.25rem 0.75rem;
  margin-bottom: 0.65rem;
}

.progress-panel__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
}

.progress-panel__hint,
.progress-panel__placeholder {
  margin: 0;
  font-size: 0.68rem;
  color: #8b929e;
}

.progress-panel--body {
  padding: 0;
  background: transparent;
  border: 0;
}
</style>
