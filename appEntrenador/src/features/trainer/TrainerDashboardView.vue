<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import AppLogo from '../../components/AppLogo.vue';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { getClients } from './api/clientsApi.js';
import { generateInvitationLink } from './api/invitationsApi.js';
import ClientsList from './components/ClientsList.vue';
import InviteClientAction from './components/InviteClientAction.vue';
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

const clientsWithStatus = computed(() => clients.value.map((client, index) => ({
  ...client,
  status: index % 4 === 0 ? 'Inactivo' : (index % 3 === 0 ? 'Pendiente' : 'Activo'),
})));

const filteredClients = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  if (!query) return clientsWithStatus.value;

  return clientsWithStatus.value.filter((client) => (
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

const loadClients = async () => {
  try {
    loadingClients.value = true;
    const response = await getClients();

    if (response.data.success) {
      clients.value = response.data.clients ?? [];
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

const copyInvitationLink = async ({ silent = false } = {}) => {
  if (!invitationLink.value) return false;

  try {
    await navigator.clipboard.writeText(invitationLink.value);
    if (!silent) {
      showNotification('Copiado al portapapeles', 'info');
    }
    return true;
  } catch (error) {
    console.error('Error al copiar invitación:', error);
    if (!silent) {
      showNotification('No se pudo copiar el link', 'error');
    }
    return false;
  }
};

const handleGenerateInvite = async () => {
  try {
    isGeneratingInvitation.value = true;
    const response = await generateInvitationLink();

    if (!response.data.success) {
      showNotification('No se pudo generar el link', 'error');
      return;
    }

    const link = buildInvitationLink(response.data);

    if (!link) {
      showNotification('El servidor no devolvió un link de invitación', 'error');
      return;
    }

    invitationLink.value = link;
    scheduleInviteLinkHide();

    const copied = await copyInvitationLink({ silent: true });
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
  localStorage.clear();
  router.push('/');
};

onMounted(() => {
  const storedRole = localStorage.getItem('userRole');
  const storedName = localStorage.getItem('userName');

  if (!storedRole) {
    router.push('/');
    return;
  }

  if (storedRole !== 'trainer') {
    router.push('/dashboard');
    return;
  }

  userName.value = storedName || '';
  loadClients();
});

onUnmounted(() => {
  clearInviteLinkHideTimer();
});
</script>

<template>
  <div class="dashboard-bg">
    <nav class="sidebar-pill">
      <div class="logo-wrap">
        <AppLogo size="md" />
      </div>

      <div class="nav-item active">
        <v-icon icon="mdi-view-dashboard-outline" size="24"></v-icon>
      </div>
      <div class="nav-item">
        <v-icon icon="mdi-clipboard-text-outline" size="24"></v-icon>
      </div>
      <div class="nav-item">
        <v-icon icon="mdi-chart-line" size="24"></v-icon>
      </div>
      <div class="nav-item">
        <v-icon icon="mdi-cog-outline" size="24"></v-icon>
      </div>

      <div class="nav-item nav-bottom mb-0" title="Cerrar Sesión" @click="handleLogout">
        <v-icon icon="mdi-logout-variant" size="24"></v-icon>
      </div>
    </nav>

    <main class="main-content flex-grow-1">
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
          <v-badge content="3" color="#00E5FF" text-color="#0B0D12" offset-x="4" offset-y="4">
            <button type="button" class="notification-btn" aria-label="Notificaciones">
              <v-icon icon="mdi-bell-outline" size="20" color="#8B929E"></v-icon>
            </button>
          </v-badge>

          <div class="profile-pill">
            <div class="profile-avatar">{{ getInitials(userName) }}</div>
            <div class="profile-info">
              <div class="profile-name">{{ userName }}</div>
              <div class="profile-role">Entrenador</div>
            </div>
          </div>
        </div>
      </header>

      <TrainerStatsSummary :clients-count="clients.length" />

      <div class="content-grid">
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="section-title">Actividad Mensual</h3>
              <p class="section-subtitle">Crecimiento de alumnos y planes activos</p>
            </div>
            <div class="chart-legend">
              <span class="legend-item"><span class="dot bg-cyan"></span>Alumnos</span>
              <span class="legend-item"><span class="dot bg-green"></span>Rutinas</span>
              <span class="legend-item"><span class="dot bg-orange"></span>Dietas</span>
            </div>
          </div>

          <div class="chart-container">
            <div class="y-axis">
              <span>28</span>
              <span>21</span>
              <span>14</span>
              <span>7</span>
            </div>
            <svg viewBox="0 0 620 220" preserveAspectRatio="none" class="chart-svg">
              <defs>
                <linearGradient id="cyan-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="#00E5FF" stop-opacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="55" x2="620" y2="55" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
              <line x1="0" y1="110" x2="620" y2="110" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
              <line x1="0" y1="165" x2="620" y2="165" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
              <path d="M0,155 Q80,145 160,135 T320,120 T480,95 T620,75" fill="none" stroke="#FF9800" stroke-width="2" stroke-linecap="round" />
              <path d="M0,145 Q80,130 160,118 T320,105 T480,78 T620,58" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" />
              <path d="M0,130 Q80,115 160,100 T320,82 T480,52 T620,32" fill="none" stroke="#00E5FF" stroke-width="2.5" stroke-linecap="round" />
              <path d="M0,130 Q80,115 160,100 T320,82 T480,52 T620,32 L620,220 L0,220 Z" fill="url(#cyan-gradient)" />
            </svg>
          </div>
        </div>

        <InviteClientAction
          :loading="isGeneratingInvitation"
          :invitation-link="invitationLink"
          @generate-invite="handleGenerateInvite"
          @copy-invite="copyInvitationLink"
        />
      </div>
    </main>

    <ClientsList
      v-model:search-query="searchQuery"
      :clients="filteredClients"
      :loading="loadingClients"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top right">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style src="../../assets/trainerDashboard.css" scoped></style>
