<script setup>
import { nextTick, ref, watch } from 'vue';

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
  currentUserId: {
    type: Number,
    required: true,
  },
});

const listRef = ref(null);

const isMine = (message) => Number(message.sender_id) === Number(props.currentUserId);

const formatTime = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

const scrollToBottom = async () => {
  await nextTick();
  const el = listRef.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
};

watch(
  () => props.messages.length,
  () => {
    scrollToBottom();
  },
  { flush: 'post' },
);

defineExpose({ scrollToBottom });
</script>

<template>
  <div ref="listRef" class="chat-message-list" role="log" aria-live="polite">
    <p v-if="!messages.length" class="chat-message-list__empty text-medium-emphasis">
      Aún no hay mensajes. Escribe el primero.
    </p>

    <div
      v-for="message in messages"
      :key="message.id"
      class="chat-message-list__row"
      :class="{ 'chat-message-list__row--mine': isMine(message) }"
      v-memo="[message.id, message.is_read]"
    >
      <div
        class="chat-bubble"
        :class="isMine(message) ? 'chat-bubble--mine' : 'chat-bubble--theirs'"
      >
        <p class="chat-bubble__text">{{ message.content }}</p>
        <span class="chat-bubble__time">{{ formatTime(message.created_at) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-message-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-message-list__empty {
  margin: auto;
  text-align: center;
  font-size: 0.9rem;
}

.chat-message-list__row {
  display: flex;
  justify-content: flex-start;
}

.chat-message-list__row--mine {
  justify-content: flex-end;
}

.chat-bubble {
  max-width: min(78%, 28rem);
  padding: 0.55rem 0.75rem 0.35rem;
  border-radius: 14px;
  word-break: break-word;
}

.chat-bubble--mine {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-bottom-right-radius: 4px;
}

.chat-bubble--theirs {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface));
  border-bottom-left-radius: 4px;
}

.chat-bubble__text {
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.95rem;
  line-height: 1.4;
}

.chat-bubble__time {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.7rem;
  opacity: 0.7;
  text-align: right;
}
</style>
