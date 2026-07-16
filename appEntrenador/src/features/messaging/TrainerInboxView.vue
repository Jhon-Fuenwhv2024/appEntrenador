<script setup>
/**
 * Trainer inbox: client list + active chat thread (WhatsApp-style split).
 */
import { computed, onMounted, ref, shallowRef } from 'vue';
import { useDisplay } from 'vuetify';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import { getClients } from '../trainer/api/clientsApi.js';
import ChatThread from './components/ChatThread.vue';

const router = useRouter();
const { mdAndUp } = useDisplay();

const loading = shallowRef(true);
const clients = ref([]);
const selectedClientId = shallowRef(null);
const mobileShowChat = shallowRef(false);
const loadError = shallowRef('');

const selectedClient = computed(() =>
  clients.value.find((c) => Number(c.id) === Number(selectedClientId.value)) || null,
);

const showListPane = computed(() => mdAndUp.value || !mobileShowChat.value);
const showChatPane = computed(() => mdAndUp.value || mobileShowChat.value);

const loadClients = async () => {
  loading.value = true;
  loadError.value = '';

  try {
    const response = await getClients();
    clients.value = response.data?.clients ?? [];
  } catch (error) {
    console.error('Error cargando alumnos para inbox:', error);
    clients.value = [];
    loadError.value = getApiErrorMessage(error, 'No se pudieron cargar los alumnos');
  } finally {
    loading.value = false;
  }
};

const selectClient = (client) => {
  if (!client?.id) return;
  selectedClientId.value = Number(client.id);
  mobileShowChat.value = true;
};

const backToList = () => {
  mobileShowChat.value = false;
};

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'trainer') {
    router.push('/');
    return;
  }
  loadClients();
});
</script>

<template>
  <AppShell role="trainer" active="messages">
    <div class="trainer-inbox">
      <aside
        v-show="showListPane"
        class="trainer-inbox__aside"
      >
        <header class="trainer-inbox__aside-header">
          <h1 class="trainer-inbox__title">Mensajes</h1>
          <p class="text-caption text-medium-emphasis mb-0">
            Selecciona un alumno para chatear
          </p>
        </header>

        <v-alert
          v-if="loadError"
          type="error"
          variant="tonal"
          density="compact"
          class="ma-3"
        >
          {{ loadError }}
        </v-alert>

        <div v-if="loading" class="trainer-inbox__loading">
          <v-progress-circular indeterminate color="primary" size="32" />
        </div>

        <v-list
          v-else
          class="trainer-inbox__list"
          bg-color="transparent"
        >
          <v-list-item
            v-for="client in clients"
            :key="client.id"
            :title="client.nombre"
            :subtitle="client.username"
            :active="Number(client.id) === Number(selectedClientId)"
            rounded="lg"
            class="mb-1"
            @click="selectClient(client)"
          >
            <template #prepend>
              <v-avatar color="surface-variant" size="40">
                <span class="text-caption">{{ (client.nombre || '?').charAt(0) }}</span>
              </v-avatar>
            </template>
          </v-list-item>

          <p
            v-if="!clients.length"
            class="text-medium-emphasis text-center pa-6"
          >
            Aún no tienes alumnos.
          </p>
        </v-list>
      </aside>

      <section
        v-show="showChatPane"
        class="trainer-inbox__chat"
      >
        <div v-if="!mdAndUp && selectedClient" class="trainer-inbox__mobile-bar">
          <v-btn
            variant="text"
            icon="mdi-arrow-left"
            aria-label="Volver a la lista"
            @click="backToList"
          />
          <span class="font-weight-medium">{{ selectedClient.nombre }}</span>
        </div>

        <ChatThread
          v-if="selectedClientId"
          :key="selectedClientId"
          :partner-id="selectedClientId"
          :partner-name="selectedClient?.nombre || ''"
        />

        <div v-else class="trainer-inbox__placeholder">
          <v-icon icon="mdi-message-text-outline" size="48" class="mb-3" />
          <p class="text-medium-emphasis mb-0">
            Elige un alumno para abrir el chat
          </p>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.trainer-inbox {
  display: flex;
  height: calc(100dvh - 4.5rem);
  max-height: calc(100dvh - 4.5rem);
  min-height: 20rem;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgb(var(--v-theme-surface));
}

.trainer-inbox__aside {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 0;
}

@media (min-width: 960px) {
  .trainer-inbox__aside {
    width: 320px;
    max-width: 36%;
    flex-shrink: 0;
  }
}

.trainer-inbox__aside-header {
  padding: 1rem 1rem 0.75rem;
  flex-shrink: 0;
}

.trainer-inbox__title {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  font-weight: 700;
}

.trainer-inbox__list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.trainer-inbox__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trainer-inbox__chat {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.trainer-inbox__mobile-bar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.trainer-inbox__placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}
</style>
