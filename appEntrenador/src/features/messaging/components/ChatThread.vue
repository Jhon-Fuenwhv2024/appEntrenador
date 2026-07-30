<script setup>
/**
 * Chat thread chrome: header + history + composer.
 * Visual shell is presentational; data/SSE stay in this composition surface.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import { getSessionUser } from '../../../shared/auth/session.js';
import { resolveAvatarSrc } from '../../../shared/utils/avatar.js';
import { getConversation, getPartnerPresence, sendMessage } from '../api/messagesApi.js';
import { useChatStream } from '../composables/useChatStream.js';
import { useUnreadMessages } from '../composables/useUnreadMessages.js';
import ChatComposer from './ChatComposer.vue';
import ChatMessageList from './ChatMessageList.vue';

const PRESENCE_POLL_MS = 12_000;

const props = defineProps({
  partnerId: {
    type: Number,
    required: true,
  },
  partnerName: {
    type: String,
    default: '',
  },
  partnerFotoUrl: {
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
const resolvedPartnerFotoUrl = shallowRef(props.partnerFotoUrl || '');
/** Partner has an active SSE stream (not "my" connection). */
const partnerOnline = shallowRef(false);
const messageListRef = ref(null);

const streamEnabled = computed(() => Number(props.partnerId) > 0);
const { refresh: refreshUnread } = useUnreadMessages({ autoStart: false });

const partnerInitial = computed(() => {
  const name = String(resolvedPartnerName.value || '?').trim();
  return name.charAt(0).toUpperCase() || '?';
});

const partnerAvatarSrc = computed(() => resolveAvatarSrc(resolvedPartnerFotoUrl.value));
const hasPartnerPhoto = computed(() => {
  const url = String(resolvedPartnerFotoUrl.value || '').trim();
  return Boolean(url) && url !== 'default_avatar.png';
});

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

useChatStream(appendIfRelevant, { enabled: streamEnabled });

const statusLabel = computed(() => (
  partnerOnline.value ? 'En línea' : 'Desconectado'
));

let presenceTimer = null;

const refreshPresence = async () => {
  if (!props.partnerId) {
    partnerOnline.value = false;
    return;
  }

  try {
    const response = await getPartnerPresence(props.partnerId);
    partnerOnline.value = Boolean(response.data?.data?.isOnline);
  } catch (error) {
    console.error('Error consultando presencia del chat:', error);
  }
};

const startPresencePoll = () => {
  if (presenceTimer != null) return;
  presenceTimer = setInterval(() => {
    refreshPresence();
  }, PRESENCE_POLL_MS);
};

const stopPresencePoll = () => {
  if (presenceTimer != null) {
    clearInterval(presenceTimer);
    presenceTimer = null;
  }
};

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
    }
    if (data?.partner) {
      resolvedPartnerFotoUrl.value = data.partner.foto_url || '';
      partnerOnline.value = Boolean(data.partner.is_online);
      emit('partner-loaded', data.partner);
    }
  } catch (error) {
    console.error('Error cargando historial de chat:', error);
    messages.value = [];
    loadError.value = getApiErrorMessage(error, 'No se pudo cargar el chat');
  } finally {
    loadingHistory.value = false;
  }

  // Tras montar la lista con el historial, ir al último mensaje.
  await nextTick();
  messageListRef.value?.scrollToBottom?.();

  try {
    await refreshUnread();
  } catch (error) {
    console.error('Error refrescando resumen de no leídos:', error);
  }

  await refreshPresence();
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
    await nextTick();
    messageListRef.value?.scrollToBottom?.();
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
    resolvedPartnerFotoUrl.value = props.partnerFotoUrl || '';
    partnerOnline.value = false;
    await loadHistory();
  },
);

watch(
  () => props.partnerName,
  (name) => {
    if (name) resolvedPartnerName.value = name;
  },
);

watch(
  () => props.partnerFotoUrl,
  (url) => {
    if (url) resolvedPartnerFotoUrl.value = url;
  },
);

onMounted(async () => {
  currentUserId.value = getSessionUser()?.id ?? 0;
  await loadHistory();
  startPresencePoll();
});

onUnmounted(() => {
  stopPresencePoll();
});
</script>

<template>
  <div class="chat-thread">
    <header v-if="resolvedPartnerName" class="chat-thread__header">
      <div class="chat-thread__identity">
        <div
          class="chat-thread__avatar"
          :class="{ 'chat-thread__avatar--photo': hasPartnerPhoto }"
          aria-hidden="true"
        >
          <img
            v-if="hasPartnerPhoto"
            class="chat-thread__avatar-img"
            :src="partnerAvatarSrc"
            alt=""
          >
          <span v-else>{{ partnerInitial }}</span>
        </div>
        <div class="chat-thread__meta">
          <h2 class="chat-thread__title">{{ resolvedPartnerName }}</h2>
          <p
            class="chat-thread__status"
            :class="{ 'chat-thread__status--online': partnerOnline }"
          >
            <span class="chat-thread__status-dot" aria-hidden="true" />
            {{ statusLabel }}
          </p>
        </div>
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
      ref="messageListRef"
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
  background:
    radial-gradient(1200px 480px at 10% -10%, rgba(0, 229, 255, 0.05), transparent 55%),
    radial-gradient(900px 400px at 100% 0%, rgba(0, 229, 255, 0.03), transparent 50%),
    #0d1017;
}

.chat-thread__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(17, 20, 28, 0.92);
  backdrop-filter: blur(10px);
}

.chat-thread__identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.chat-thread__avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.22);
  overflow: hidden;
}

.chat-thread__avatar--photo {
  color: transparent;
  background: #171b24;
  border-color: rgba(255, 255, 255, 0.1);
}

.chat-thread__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.chat-thread__meta {
  min-width: 0;
}

.chat-thread__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  color: #f4f6f8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-thread__status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  line-height: 1.2;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.chat-thread__status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tf-on-surface-muted, #a8b0bc);
  flex-shrink: 0;
}

.chat-thread__status--online {
  color: #7dffe7;
}

.chat-thread__status--online .chat-thread__status-dot {
  background: #00e676;
  box-shadow: 0 0 0 3px rgba(0, 230, 118, 0.18);
}

.chat-thread__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
