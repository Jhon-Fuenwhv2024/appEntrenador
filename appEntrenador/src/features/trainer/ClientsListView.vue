<script setup>
/**
 * Route view for /trainer/clients — loads owned clients and filters locally.
 * Incluye diálogo de gestión de invitaciones (Feature 023) sin ítem de nav.
 */
import { computed, onMounted, reactive, ref, shallowRef } from 'vue';
import { useDisplay } from 'vuetify';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import { getClients } from './api/clientsApi.js';
import ClientsList from './components/ClientsList.vue';
import InvitesManager from './components/InvitesManager.vue';

const router = useRouter();
const { smAndUp } = useDisplay();

const searchQuery = shallowRef('');
const loading = shallowRef(true);
const clients = ref([]);
const invitesDialogOpen = shallowRef(false);

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

const filteredClients = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  if (!query) return clients.value;

  return clients.value.filter((client) => (
    String(client.nombre || '').toLowerCase().includes(query)
    || String(client.username || '').toLowerCase().includes(query)
  ));
});

const showNotification = (text, color = 'success') => {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
};

const onInvitesNotify = ({ text, color } = {}) => {
  if (!text) return;
  showNotification(text, color || 'success');
};

const loadClients = async () => {
  try {
    loading.value = true;
    const response = await getClients();

    if (response.data.success) {
      clients.value = response.data.clients ?? [];
    } else {
      clients.value = [];
      showNotification(response.data.error || 'No se pudieron cargar los alumnos', 'error');
    }
  } catch (error) {
    console.error('Error al cargar alumnos:', error);
    clients.value = [];
    showNotification(getApiErrorMessage(error, 'Error al cargar alumnos'), 'error');
  } finally {
    loading.value = false;
  }
};

const handleLogout = () => {
  clearSession();
  router.push('/');
};

const openClient = (client) => {
  if (!client?.id) return;
  router.push(`/trainer/clients/${client.id}`);
};

const openInvitesManager = () => {
  invitesDialogOpen.value = true;
};

onMounted(() => {
  const user = getSessionUser();

  if (!user || user.rol !== 'trainer') {
    router.push('/dashboard');
    return;
  }

  loadClients();
});
</script>

<template>
  <AppShell role="trainer" active="clients">
    <main class="main-content flex-grow-1 clients-page">
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="header-title">Alumnos</h1>
          <p class="header-greeting text-medium-emphasis">
            Busca, revisa el estado del plan y entra a la ficha
          </p>
        </div>

        <div class="header-right d-flex align-center ga-2">
          <v-btn
            color="primary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-link-variant"
            class="clients-page__invites-btn"
            aria-label="Gestionar invitaciones"
            title="Gestionar invitaciones"
            @click="openInvitesManager"
          >
            <span class="clients-page__invites-label">Gestionar invitaciones</span>
          </v-btn>
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

      <div class="clients-page__body">
        <ClientsList
          v-model:search-query="searchQuery"
          variant="page"
          :clients="filteredClients"
          :total-count="clients.length"
          :loading="loading"
          @select-client="openClient"
          @invite="openInvitesManager"
        />
      </div>
    </main>
  </AppShell>

  <v-dialog
    v-model="invitesDialogOpen"
    :fullscreen="!smAndUp"
    :max-width="smAndUp ? 720 : undefined"
    scrollable
  >
    <v-card class="invites-dialog-card">
      <v-card-title class="d-flex align-center justify-space-between pe-2">
        <span class="text-subtitle-1 font-weight-medium">Gestión de invitaciones</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar"
          @click="invitesDialogOpen = false"
        />
      </v-card-title>
      <v-divider />
      <v-card-text class="invites-dialog-body">
        <InvitesManager
          v-if="invitesDialogOpen"
          @notify="onInvitesNotify"
        />
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
    {{ snackbar.text }}
    <template #actions>
      <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
    </template>
  </v-snackbar>
</template>

<style src="../../assets/trainerDashboard.css" scoped></style>

<style scoped>
.clients-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.clients-page__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 16px 24px;
}

.clients-page__invites-label {
  display: none;
}

.invites-dialog-card {
  max-height: 100%;
}

.invites-dialog-body {
  padding-top: 16px;
  padding-bottom: 24px;
}

@media (min-width: 600px) {
  .clients-page__invites-label {
    display: inline;
  }
}

@media (min-width: 961px) {
  .clients-page__body {
    padding: 0 24px 32px;
  }
}
</style>
