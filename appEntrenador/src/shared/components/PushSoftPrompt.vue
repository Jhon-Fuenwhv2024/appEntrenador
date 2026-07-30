<script setup>
/**
 * Soft prompt for Web Push opt-in (Feature 051). Dismissible; not blocking.
 */
import { computed, onMounted, shallowRef } from 'vue';
import { usePushNotifications } from '../composables/usePushNotifications.js';

const emit = defineEmits(['notify']);

const {
  canPrompt,
  busy,
  lastError,
  enabledOnServer,
  checkServerEnabled,
  enablePush,
  dismissPrompt,
  refreshSubscriptionState,
} = usePushNotifications();

const visible = shallowRef(false);

const show = computed(() => visible.value && canPrompt.value && enabledOnServer.value);

onMounted(async () => {
  await refreshSubscriptionState();
  await checkServerEnabled();
  // Delay so it doesn't compete with first paint / dashboards.
  window.setTimeout(() => {
    visible.value = true;
  }, 2500);
});

async function onEnable() {
  const ok = await enablePush();
  visible.value = false;
  emit(
    'notify',
    ok ? 'Notificaciones push activadas' : (lastError.value || 'No se pudo activar'),
    ok ? 'success' : 'error',
  );
}

function onDismiss() {
  dismissPrompt();
  visible.value = false;
}
</script>

<template>
  <div
    v-if="show"
    class="push-soft-prompt"
    role="region"
    aria-label="Activar notificaciones"
  >
    <div class="push-soft-prompt__body">
      <v-icon icon="mdi-bell-badge-outline" size="22" aria-hidden="true" />
      <p class="push-soft-prompt__text">
        Activa avisos para no perder rutinas, mensajes ni cambios de dieta.
      </p>
    </div>
    <div class="push-soft-prompt__actions">
      <v-btn
        color="primary"
        size="small"
        :loading="busy"
        :disabled="busy"
        aria-label="Activar notificaciones push"
        @click="onEnable"
      >
        Activar
      </v-btn>
      <v-btn
        variant="text"
        size="small"
        :disabled="busy"
        aria-label="Ahora no, cerrar aviso de notificaciones"
        @click="onDismiss"
      >
        Ahora no
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.push-soft-prompt {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0 0 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 229, 255, 0.28);
  background: rgba(0, 229, 255, 0.08);
  color: var(--tf-on-surface);
}

.push-soft-prompt__body {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  flex: 1 1 220px;
  min-width: 0;
}

.push-soft-prompt__text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.35;
  color: var(--tf-on-surface);
}

.push-soft-prompt__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}
</style>
