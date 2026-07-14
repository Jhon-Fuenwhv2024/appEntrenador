<script setup>
/**
 * Client "Mi progreso" — own workout session history (Feature 021).
 */
import { computed, onMounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { APP_NAME } from '../../config/app.js';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import WorkoutSessionHistoryList from '../../shared/components/WorkoutSessionHistoryList.vue';
import { getMyWorkoutSessions } from './api/workoutSessionsApi.js';

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
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="header-title">Mi progreso</h1>
          <p class="header-greeting text-medium-emphasis">
            Historial de entrenamientos en {{ APP_NAME }}
          </p>
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

      <div class="progress-body pa-4 pa-md-6">
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

        <v-alert v-else-if="loadError" type="error" variant="tonal" class="mb-4">
          {{ loadError }}
          <template #append>
            <v-btn variant="text" size="small" @click="loadSessions">Reintentar</v-btn>
          </template>
        </v-alert>

        <template v-else>
          <div class="progress-summary mb-4">
            <div class="progress-summary__stat">
              <span class="progress-summary__value">{{ sessions.length }}</span>
              <span class="progress-summary__label">
                {{ sessions.length === 1 ? 'sesión' : 'sesiones' }}
              </span>
            </div>
            <div class="progress-summary__stat">
              <span class="progress-summary__value">{{ completedCount }}</span>
              <span class="progress-summary__label">completadas</span>
            </div>
          </div>

          <div class="functional-card">
            <h2 class="card-section-title mb-2">Historial</h2>
            <p class="text-caption text-medium-emphasis mb-4">
              Toca una sesión para ver peso y repeticiones por serie.
            </p>
            <WorkoutSessionHistoryList
              :sessions="sessions"
              empty-text="Aún no has registrado entrenamientos. Completa una rutina desde Inicio."
            />
          </div>
        </template>
      </div>
    </main>
  </AppShell>
</template>

<style src="../../assets/clientDashboard.css" scoped></style>

<style scoped>
.progress-body {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}

.progress-summary {
  display: flex;
  gap: 0.75rem;
}

.progress-summary__stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.progress-summary__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #00e5ff;
  line-height: 1.1;
}

.progress-summary__label {
  font-size: 0.75rem;
  color: #8b929e;
  text-transform: lowercase;
}

.functional-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.5rem;
}

.card-section-title {
  font-size: 1.1rem;
  font-weight: 700;
}

@media (max-width: 600px) {
  .functional-card {
    padding: 1rem;
  }
}
</style>
