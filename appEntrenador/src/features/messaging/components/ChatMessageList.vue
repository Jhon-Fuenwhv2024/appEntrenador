<script setup>
/**
 * Presentational message list with day separators and refined bubbles.
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue';

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
const bottomAnchorRef = ref(null);

const isMine = (message) => Number(message.sender_id) === Number(props.currentUserId);

const formatTime = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

const dayKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const formatDayLabel = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startToday - startMsg) / 86400000);

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';

  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
};

const timeline = computed(() => {
  const items = [];
  let lastDay = null;

  for (const message of props.messages) {
    const key = dayKey(message.created_at);
    if (key && key !== lastDay) {
      items.push({
        type: 'day',
        id: `day-${key}`,
        label: formatDayLabel(message.created_at),
      });
      lastDay = key;
    }
    items.push({ type: 'message', id: message.id, message });
  }

  return items;
});

/**
 * Scroll al último mensaje. Reintenta tras layout (nextTick + rAF) porque al abrir
 * el hilo la lista monta con el historial ya cargado y scrollHeight aún puede ser 0.
 */
const scrollToBottom = async () => {
  await nextTick();

  const apply = () => {
    const el = listRef.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    bottomAnchorRef.value?.scrollIntoView({ block: 'end', inline: 'nearest' });
  };

  apply();
  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(apply);
  });
};

const lastMessageId = computed(() => {
  const list = props.messages;
  if (!list.length) return null;
  return list[list.length - 1]?.id ?? null;
});

watch(
  () => [props.messages.length, lastMessageId.value],
  () => {
    scrollToBottom();
  },
  { flush: 'post', immediate: true },
);

onMounted(() => {
  scrollToBottom();
});

defineExpose({ scrollToBottom });
</script>

<template>
  <div ref="listRef" class="chat-message-list" role="log" aria-live="polite">
    <div v-if="!messages.length" class="chat-message-list__empty">
      <div class="chat-message-list__empty-icon" aria-hidden="true">
        <v-icon icon="mdi-message-outline" size="22" />
      </div>
      <p class="chat-message-list__empty-title">Sin mensajes aún</p>
      <p class="chat-message-list__empty-desc">
        Escribe el primero para empezar la conversación.
      </p>
    </div>

    <template v-for="item in timeline" :key="item.id">
      <div v-if="item.type === 'day'" class="chat-message-list__day">
        <span class="chat-message-list__day-label">{{ item.label }}</span>
      </div>

      <div
        v-else
        class="chat-message-list__row"
        :class="{ 'chat-message-list__row--mine': isMine(item.message) }"
        v-memo="[item.message.id, item.message.is_read]"
      >
        <div
          class="chat-bubble"
          :class="isMine(item.message) ? 'chat-bubble--mine' : 'chat-bubble--theirs'"
        >
          <p class="chat-bubble__text">{{ item.message.content }}</p>
          <time class="chat-bubble__time" :datetime="item.message.created_at">
            {{ formatTime(item.message.created_at) }}
          </time>
        </div>
      </div>
    </template>

    <div
      ref="bottomAnchorRef"
      class="chat-message-list__anchor"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.chat-message-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* legacy Edge/IE */
  padding: 1.1rem 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 18px 18px;
}

.chat-message-list::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none; /* Chrome / Safari / Edge */
}

.chat-message-list__empty {
  margin: auto;
  text-align: center;
  max-width: 16rem;
  padding: 1.5rem 1rem;
}

.chat-message-list__empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 0.75rem;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--tf-on-surface-muted, #a8b0bc);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.chat-message-list__empty-title {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f4f6f8;
}

.chat-message-list__empty-desc {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.chat-message-list__day {
  display: flex;
  justify-content: center;
  margin: 0.35rem 0 0.15rem;
}

.chat-message-list__day-label {
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--tf-on-surface-muted, #a8b0bc);
  background: rgba(17, 20, 28, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.chat-message-list__row {
  display: flex;
  justify-content: flex-start;
}

.chat-message-list__row--mine {
  justify-content: flex-end;
}

.chat-message-list__anchor {
  width: 100%;
  height: 1px;
  flex-shrink: 0;
  pointer-events: none;
}

.chat-bubble {
  max-width: min(76%, 30rem);
  padding: 0.65rem 0.85rem 0.45rem;
  border-radius: 18px;
  word-break: break-word;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
}

.chat-bubble--mine {
  background: linear-gradient(160deg, #1de9ff 0%, #00c6d9 100%);
  color: rgb(var(--v-theme-on-primary));
  border-bottom-right-radius: 6px;
}

.chat-bubble--theirs {
  background: #171b24;
  color: #eef1f4;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom-left-radius: 6px;
}

.chat-bubble__text {
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.935rem;
  line-height: 1.45;
  letter-spacing: 0.005em;
}

.chat-bubble__time {
  display: block;
  margin-top: 0.28rem;
  font-size: 0.68rem;
  line-height: 1;
  letter-spacing: 0.02em;
  text-align: right;
  opacity: 0.72;
}

.chat-bubble--mine .chat-bubble__time {
  color: rgba(11, 13, 18, 0.72);
  opacity: 1;
}

.chat-bubble--theirs .chat-bubble__time {
  color: var(--tf-on-surface-muted, #a8b0bc);
  opacity: 1;
}
</style>
