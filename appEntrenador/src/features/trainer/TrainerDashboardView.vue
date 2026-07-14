<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { clearSession } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import { getClients, getTrainerDashboard } from './api/clientsApi.js';
import { generateInvitationLink } from './api/invitationsApi.js';
import ClientsList from './components/ClientsList.vue';
import InviteClientAction from './components/InviteClientAction.vue';
import TrainerMonthlyActivityChart from './components/TrainerMonthlyActivityChart.vue';
import TrainerStatsSummary from './components/TrainerStatsSummary.vue';

/** Tiempo que el link permanece visible antes de ocultarse solo. */
const INVITE_LINK_VISIBLE_MS = 60_000;

const router = useRouter();

const userName = shallowRef('');
const invitationLink = shallowRef('');
const isGeneratingInvitation = shallowRef(false);
const searchQuery = shallowRef('');
const loadingClients = shallowRef(true);
const clients = ref([]);
const dashboardStats = reactive({
  clientsCount: 0,
  routinesCount: 0,
  sessionsThisMonth: 0,
  growthPercent: 0,
  monthlyActivity: [],
});
let inviteLinkHideTimer = null;

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

const currentDateLabel = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date().toLocaleDateString('es-ES', options);

  return date
    .split(', ')
    .map((part, index) => {
      if (index === 0) return part.charAt(0).toUpperCase() + part.slice(1);
      return part.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    })
    .join(', ');
});

const filteredClients = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  if (!query) return clients.value;

  return clients.value.filter((client) => (
    client.nombre.toLowerCase().includes(query)
    || client.username.toLowerCase().includes(query)
  ));
});

const getInitials = (name) => {
  if (!name) return '??';

  const parts = name.trim().split(/\s+/);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
};

const showNotification = (text, color = 'success') => {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
};

const loadDashboard = async () => {
  try {
    const response = await getTrainerDashboard();
    const data = response.data?.data || {};

    dashboardStats.clientsCount = Number(data.clientsCount) || 0;
    dashboardStats.routinesCount = Number(data.routinesCount) || 0;
    dashboardStats.sessionsThisMonth = Number(data.sessionsThisMonth) || 0;
    dashboardStats.growthPercent = Number(data.growthPercent) || 0;
    dashboardStats.monthlyActivity = Array.isArray(data.monthlyActivity)
      ? data.monthlyActivity
      : [];
  } catch (error) {
    console.error('Error al cargar dashboard:', error);
    // Fallback desde lista de alumnos ya cargada (evita mostrar 0 si el endpoint falla)
    syncStatsFromClients();
    showNotification(getApiErrorMessage(error, 'Error al cargar métricas'), 'error');
  }
};

const syncStatsFromClients = () => {
  const list = clients.value;
  dashboardStats.clientsCount = list.length;
  dashboardStats.routinesCount = list.reduce(
    (sum, client) => sum + (Number(client.routines_count) || 0),
    0,
  );
};

const loadClients = async () => {
  try {
    loadingClients.value = true;
    const response = await getClients();

    if (response.data.success) {
      clients.value = response.data.clients ?? [];
      // Si el dashboard aún no llegó o falló, al menos reflejar alumnos/rutinas reales
      if (dashboardStats.clientsCount === 0 && clients.value.length > 0) {
        syncStatsFromClients();
      }
    }
  } catch (error) {
    console.error('Error al cargar alumnos:', error);
    showNotification(getApiErrorMessage(error, 'Error al cargar alumnos'), 'error');
  } finally {
    loadingClients.value = false;
  }
};

const buildInvitationLink = (payload = {}) => {
  // Prefer current frontend origin so the link matches the running app (port/host).
  if (payload.token) {
    return `${window.location.origin}/registro?token=${payload.token}`;
  }
  return payload.link_invitacion || '';
};

const clearInviteLinkHideTimer = () => {
  if (inviteLinkHideTimer) {
    clearTimeout(inviteLinkHideTimer);
    inviteLinkHideTimer = null;
  }
};

const scheduleInviteLinkHide = () => {
  clearInviteLinkHideTimer();
  inviteLinkHideTimer = setTimeout(() => {
    invitationLink.value = '';
    inviteLinkHideTimer = null;
  }, INVITE_LINK_VISIBLE_MS);
};

const copyInvitationLink = async () => {
  if (!invitationLink.value) return false;

  try {
    await navigator.clipboard.writeText(invitationLink.value);
    return true;
  } catch (error) {
    console.error('No se pudo copiar el link:', error);
    return false;
  }
};

const handleGenerateInvite = async () => {
  try {
    isGeneratingInvitation.value = true;
    const response = await generateInvitationLink();
    const payload = response.data?.data || response.data || {};
    invitationLink.value = buildInvitationLink(payload);
    scheduleInviteLinkHide();

    const copied = await copyInvitationLink();
    showNotification(
      copied
        ? 'Link generado y copiado al portapapeles'
        : 'Link generado. Usa el botón Copiar si hace falta',
      copied ? 'success' : 'info',
    );
  } catch (error) {
    console.error('Error al generar invitación:', error);
    showNotification(getApiErrorMessage(error, 'Error al generar'), 'error');
  } finally {
    isGeneratingInvitation.value = false;
  }
};

const handleLogout = () => {
  clearSession();
  router.push('/');
};

const openClientRoutines = (client) => {
  if (!client?.id) return;
  router.push(`/trainer/clients/${client.id}`);
};

onMounted(() => {
  const storedRole = localStorage.getItem('userRole');
  const storedName = localStorage.getItem('userName');
  const storedToken = localStorage.getItem('authToken');

  if (!storedRole || !storedToken) {
    router.push('/');
    return;
  }

  if (storedRole !== 'trainer') {
    router.push('/dashboard');
    return;
  }

  userName.value = storedName || '';
  Promise.all([loadClients(), loadDashboard()]);
});

onUnmounted(() => {
  clearInviteLinkHideTimer();
});
</script>

<template>
  <AppShell role="trainer" active="dashboard">
    <main class="main-content flex-grow-1 trainer-dash-main">
      <header class="dashboard-header">
        <div class="header-left">
          <div class="header-date">
            <v-icon icon="mdi-calendar-blank-outline" size="14"></v-icon>
            {{ currentDateLabel }}
          </div>
          <h1 class="header-title">Dashboard</h1>
          <p class="header-greeting">
            Bienvenido de vuelta, <span class="text-cyan">{{ userName }}</span>
          </p>
        </div>

        <div class="header-right">
          <button type="button" class="notification-btn" aria-label="Notificaciones" disabled>
            <v-icon icon="mdi-bell-outline" size="20" color="#8B929E"></v-icon>
          </button>

          <div class="profile-pill">
            <div class="profile-avatar">{{ getInitials(userName) }}</div>
            <div class="profile-info">
              <div class="profile-name">{{ userName }}</div>
              <div class="profile-role">Entrenador</div>
            </div>
          </div>

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

      <div class="trainer-dash-body">
        <div class="stack-stats">
          <TrainerStatsSummary
            :clients-count="dashboardStats.clientsCount"
            :routines-count="dashboardStats.routinesCount"
            :sessions-this-month="dashboardStats.sessionsThisMonth"
            :growth-percent="dashboardStats.growthPercent"
          />
        </div>

        <ClientsList
          v-model:search-query="searchQuery"
          :clients="filteredClients"
          :loading="loadingClients"
          @select-client="openClientRoutines"
        />

        <div class="stack-content content-grid">
          <TrainerMonthlyActivityChart :months="dashboardStats.monthlyActivity" />

          <InviteClientAction
            :loading="isGeneratingInvitation"
            :invitation-link="invitationLink"
            @generate-invite="handleGenerateInvite"
            @copy-invite="copyInvitationLink"
            @open-routines-hint="showNotification('Selecciona un alumno en la lista de alumnos para asignar rutinas', 'info')"
          />
        </div>
      </div>
    </main>
  </AppShell>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
    {{ snackbar.text }}
    <template v-slot:actions>
      <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
    </template>
  </v-snackbar>
</template>

<style src="../../assets/trainerDashboard.css" scoped></style>

<style scoped>
.trainer-dash-main {
  display: flex;
  flex-direction: column;
}

.trainer-dash-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

@media (max-width: 960px) {
  :deep(.right-panel) {
    width: 100%;
    min-width: 0;
    height: auto;
    max-height: 42vh;
    margin: 0;
    border-radius: 16px;
  }
}

@media (min-width: 961px) {
  .trainer-dash-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 310px;
    grid-template-rows: auto 1fr;
    gap: 0 20px;
    align-items: start;
  }

  .stack-stats {
    grid-column: 1;
    grid-row: 1;
  }

  .stack-content {
    grid-column: 1;
    grid-row: 2;
  }

  :deep(.right-panel) {
    grid-column: 2;
    grid-row: 1 / span 2;
    width: 310px;
    min-width: 310px;
    height: calc(100vh - 160px);
    max-height: calc(100dvh - 160px);
    margin: 0;
    position: sticky;
    top: 0;
  }
}
</style>
