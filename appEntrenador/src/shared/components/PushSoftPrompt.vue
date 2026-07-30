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
    <div class="push-soft-prompt__accent" aria-hidden="true" />
    <div class="push-soft-prompt__content">
      <div class="push-soft-prompt__body">
        <div class="push-soft-prompt__icon" aria-hidden="true">
          <v-icon icon="mdi-bell-badge-outline" size="22" />
        </div>
        <div class="push-soft-prompt__copy">
          <p class="push-soft-prompt__title">No te pierdas nada</p>
          <p class="push-soft-prompt__text">
            Activa avisos para rutinas, mensajes y cambios de dieta.
          </p>
        </div>
      </div>
      <div class="push-soft-prompt__actions">
        <v-btn
          color="primary"
          class="push-soft-prompt__cta"
          :loading="busy"
          :disabled="busy"
          aria-label="Activar notificaciones push"
          @click="onEnable"
        >
          Activar
        </v-btn>
        <v-btn
          variant="text"
          class="push-soft-prompt__dismiss"
          :disabled="busy"
          aria-label="Ahora no, cerrar aviso de notificaciones"
          @click="onDismiss"
        >
          Ahora no
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.push-soft-prompt {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  margin: 0 0 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 229, 255, 0.28);
  background: rgba(0, 229, 255, 0.08);
  color: var(--tf-on-surface);
  overflow: hidden;
}

.push-soft-prompt__accent {
  flex-shrink: 0;
  width: 4px;
  background: #00e5ff;
}

.push-soft-prompt__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.85rem 1rem 0.85rem 0.9rem;
}

.push-soft-prompt__body {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1 1 220px;
  min-width: 0;
}

.push-soft-prompt__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.14);
  color: #00e5ff;
}

.push-soft-prompt__copy {
  min-width: 0;
}

.push-soft-prompt__title {
  margin: 0 0 2px;
  font-size: 0.9375rem;
  font-weight: 650;
  line-height: 1.3;
  letter-spacing: 0.01em;
  color: var(--tf-on-surface, #e8ecf1);
}

.push-soft-prompt__text {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.push-soft-prompt__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.push-soft-prompt__cta {
  min-height: 40px;
  min-width: 88px;
  font-weight: 700;
}

.push-soft-prompt__dismiss {
  min-height: 40px;
  min-width: 88px;
  color: var(--tf-on-surface-muted, #a8b0bc) !important;
}

.push-soft-prompt__cta:focus-visible,
.push-soft-prompt__dismiss:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
}
</style>
