<script setup>
import { shallowRef } from 'vue';

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['send']);

const draft = shallowRef('');

const submit = () => {
  const text = draft.value.trim();
  if (!text) return;
  emit('send', text);
  draft.value = '';
};
</script>

<template>
  <form class="chat-composer" @submit.prevent="submit">
    <div class="chat-composer__shell">
      <input
        v-model="draft"
        class="chat-composer__input"
        type="text"
        placeholder="Escribe un mensaje…"
        autocomplete="off"
        :disabled="disabled || loading"
        aria-label="Escribe un mensaje"
        @keydown.enter.exact.prevent="submit"
      >
      <button
        type="submit"
        class="chat-composer__send"
        :disabled="disabled || loading || !draft.trim()"
        :aria-busy="loading ? 'true' : 'false'"
        aria-label="Enviar mensaje"
      >
        <v-progress-circular
          v-if="loading"
          indeterminate
          size="18"
          width="2"
          color="on-primary"
        />
        <v-icon v-else icon="mdi-send" size="18" />
      </button>
    </div>
  </form>
</template>

<style scoped>
.chat-composer {
  flex-shrink: 0;
  padding: 0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(17, 20, 28, 0.94);
  backdrop-filter: blur(10px);
}

.chat-composer__shell {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 48px;
  padding: 0.35rem 0.4rem 0.35rem 0.95rem;
  border-radius: 16px;
  background: #12151d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.chat-composer__shell:focus-within {
  border-color: rgba(0, 229, 255, 0.45);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 0 0 3px rgba(0, 229, 255, 0.12);
}

.chat-composer__input {
  flex: 1 1 auto;
  min-width: 0;
  height: 40px;
  border: none;
  outline: transparent;
  background: transparent;
  color: #f4f6f8;
  font: inherit;
  font-size: 0.95rem;
  line-height: 1.3;
}

.chat-composer__input:focus-visible {
  outline: none;
}

.chat-composer__input::placeholder {
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.chat-composer__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chat-composer__send {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border: none;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  color: rgb(var(--v-theme-on-primary));
  background: linear-gradient(160deg, #1de9ff 0%, #00c6d9 100%);
  transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 14px rgba(0, 198, 217, 0.28);
}

.chat-composer__send:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 198, 217, 0.35);
}

.chat-composer__send:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: 2px;
}

.chat-composer__send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
</style>
