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
    <v-text-field
      v-model="draft"
      class="chat-composer__field"
      placeholder="Escribe un mensaje…"
      hide-details
      density="comfortable"
      variant="outlined"
      bg-color="surface"
      autocomplete="off"
      :disabled="disabled || loading"
      @keydown.enter.exact.prevent="submit"
    />
    <v-btn
      type="submit"
      color="primary"
      icon="mdi-send"
      size="large"
      :loading="loading"
      :disabled="disabled || loading || !draft.trim()"
      aria-label="Enviar mensaje"
    />
  </form>
</template>

<style scoped>
.chat-composer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgb(var(--v-theme-surface));
  flex-shrink: 0;
}

.chat-composer__field {
  flex: 1 1 auto;
}
</style>
