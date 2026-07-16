<script setup>
/**
 * Chat thread: loads history, opens SSE, renders bubbles + composer.
 * Props: partnerId (required), partnerName (optional label).
 */
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getSessionUser } from '../../../shared/auth/session.js';
import { getConversation, sendMessage } from '../api/messagesApi.js';
import { useChatStream } from '../composables/useChatStream.js';
import ChatComposer from './ChatComposer.vue';
import ChatMessageList from './ChatMessageList.vue';

const props = defineProps({
  partnerId: {
    type: Number,
    required: true,
  },
  partnerName: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['partner-loaded']);

const currentUserId = shallowRef(getSessionUser()?.id ?? 0);
const messages = ref([]);
const loadingHistory = shallowRef(false);
const sending = shallowRef(false);
const loadError = shallowRef('');
const sendError = shallowRef('');
const resolvedPartnerName = shallowRef(props.partnerName);

const streamEnabled = computed(() => Number(props.partnerId) > 0);

const appendIfRelevant = (message) => {
  if (!message?.id) return;

  const partnerId = Number(props.partnerId);
  const me = Number(currentUserId.value);
  const fromPartner = Number(message.sender_id) === partnerId && Number(message.receiver_id) === me;
  const fromMe = Number(message.sender_id) === me && Number(message.receiver_id) === partnerId;

  if (!fromPartner && !fromMe) return;

  if (messages.value.some((m) => Number(m.id) === Number(message.id))) return;
  messages.value.push(message);
};

const { connected, error: streamError } = useChatStream(
  appendIfRelevant,
  { enabled: streamEnabled },
);

const loadHistory = async () => {
  if (!props.partnerId) return;

  loadingHistory.value = true;
  loadError.value = '';

  try {
    const response = await getConversation(props.partnerId);
    const data = response.data?.data;
    messages.value = Array.isArray(data?.messages) ? data.messages : [];

    if (data?.partner?.nombre) {
      resolvedPartnerName.value = data.partner.nombre;
      emit('partner-loaded', data.partner);
    }
  } catch (error) {
    console.error('Error cargando historial de chat:', error);
    messages.value = [];
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar el chat');
  } finally {
    loadingHistory.value = false;
  }
};

const handleSend = async (content) => {
  if (!props.partnerId || sending.value) return;

  sending.value = true;
  sendError.value = '';

  try {
    const response = await sendMessage({
      receiverId: props.partnerId,
      content,
    });
    const message = response.data?.data;
    if (message) appendIfRelevant(message);
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    sendError.value = getApiErrorMessage(error, 'No se pudo enviar el mensaje');
  } finally {
    sending.value = false;
  }
};

watch(
  () => props.partnerId,
  async () => {
    messages.value = [];
    await loadHistory();
  },
);

watch(
  () => props.partnerName,
  (name) => {
    if (name) resolvedPartnerName.value = name;
  },
);

onMounted(async () => {
  currentUserId.value = getSessionUser()?.id ?? 0;
  await loadHistory();
});
</script>

<template>
  <div class="chat-thread">
    <header v-if="resolvedPartnerName" class="chat-thread__header">
      <div>
        <h2 class="chat-thread__title">{{ resolvedPartnerName }}</h2>
        <p class="chat-thread__status text-caption text-medium-emphasis">
          {{ connected ? 'En línea (tiempo real)' : (streamError || 'Conectando…') }}
        </p>
      </div>
    </header>

    <v-alert
      v-if="loadError"
      type="error"
      variant="tonal"
      density="compact"
      class="ma-3"
      closable
      @click:close="loadError = ''"
    >
      {{ loadError }}
    </v-alert>

    <v-alert
      v-if="sendError"
      type="error"
      variant="tonal"
      density="compact"
      class="ma-3"
      closable
      @click:close="sendError = ''"
    >
      {{ sendError }}
    </v-alert>

    <div v-if="loadingHistory" class="chat-thread__loading">
      <v-progress-circular indeterminate color="primary" size="36" />
    </div>

    <ChatMessageList
      v-else
      :messages="messages"
      :current-user-id="currentUserId"
    />

    <ChatComposer
      :loading="sending"
      :disabled="!partnerId || loadingHistory"
      @send="handleSend"
    />
  </div>
</template>

<style scoped>
.chat-thread {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: rgb(var(--v-theme-background));
}

.chat-thread__header {
  flex-shrink: 0;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgb(var(--v-theme-surface));
}

.chat-thread__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.chat-thread__status {
  margin: 0.15rem 0 0;
}

.chat-thread__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
