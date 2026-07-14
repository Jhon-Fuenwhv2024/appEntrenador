<script setup>
/**
 * Route view for /trainer/clients — loads owned clients and filters locally.
 */
import { computed, onMounted, reactive, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import { getClients } from './api/clientsApi.js';
import ClientsList from './components/ClientsList.vue';

const router = useRouter();

const searchQuery = shallowRef('');
const loading = shallowRef(true);
const clients = ref([]);

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

const goInvite = () => {
  router.push({ path: '/dashboard', hash: '#invite' });
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

      <div class="clients-page__body">
        <ClientsList
          v-model:search-query="searchQuery"
          variant="page"
          :clients="filteredClients"
          :total-count="clients.length"
          :loading="loading"
          @select-client="openClient"
          @invite="goInvite"
        />
      </div>
    </main>
  </AppShell>

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

@media (min-width: 961px) {
  .clients-page__body {
    padding: 0 24px 32px;
  }
}
</style>
