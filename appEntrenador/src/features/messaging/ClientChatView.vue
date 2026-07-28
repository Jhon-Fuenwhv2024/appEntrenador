<script setup>
/**
 * Client chat with assigned trainer (single thread).
 */
import { onMounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import { getChatPartner } from './api/messagesApi.js';
import ChatThread from './components/ChatThread.vue';

const router = useRouter();

const loading = shallowRef(true);
const loadError = shallowRef('');
const partnerId = shallowRef(null);
const partnerName = shallowRef('');
const partnerFotoUrl = shallowRef('');

const loadPartner = async () => {
  loading.value = true;
  loadError.value = '';

  try {
    const response = await getChatPartner();
    const partner = response.data?.data;
    partnerId.value = partner?.id ? Number(partner.id) : null;
    partnerName.value = partner?.nombre || 'Tu entrenador';
    partnerFotoUrl.value = partner?.foto_url || '';
  } catch (error) {
    console.error('Error obteniendo entrenador para chat:', error);
    partnerId.value = null;
    partnerFotoUrl.value = '';
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar el chat con tu entrenador');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'client') {
    router.push('/');
    return;
  }
  loadPartner();
});
</script>

<template>
  <AppShell role="client" active="messages">
    <div class="client-chat">
      <div v-if="loading" class="client-chat__state">
        <v-progress-circular indeterminate color="primary" size="40" />
      </div>

      <v-alert
        v-else-if="loadError"
        type="error"
        variant="tonal"
        class="ma-4"
      >
        {{ loadError }}
      </v-alert>

      <ChatThread
        v-else-if="partnerId"
        :partner-id="partnerId"
        :partner-name="partnerName"
        :partner-foto-url="partnerFotoUrl"
      />

      <div v-else class="client-chat__state">
        <p class="text-medium-emphasis">No hay entrenador asignado para chatear.</p>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.client-chat {
  height: calc(100dvh - 4.5rem);
  max-height: calc(100dvh - 4.5rem);
  min-height: 20rem;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #0d1017;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
}

.client-chat__state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}
</style>
