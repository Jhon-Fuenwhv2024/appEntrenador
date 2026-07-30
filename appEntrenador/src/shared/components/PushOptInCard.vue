<script setup>
/**
 * Toggle to enable/disable Web Push (Feature 051).
 */
import { onMounted, shallowRef, watch } from 'vue';
import { usePushNotifications } from '../composables/usePushNotifications.js';

const emit = defineEmits(['notify']);

const {
  supported,
  subscribed,
  busy,
  lastError,
  enabledOnServer,
  refreshSubscriptionState,
  checkServerEnabled,
  enablePush,
  disablePush,
} = usePushNotifications();

const localOn = shallowRef(false);

onMounted(async () => {
  await refreshSubscriptionState();
  await checkServerEnabled();
  localOn.value = subscribed.value;
});

watch(subscribed, (value) => {
  localOn.value = value;
});

async function onToggle(value) {
  if (value) {
    const ok = await enablePush();
    localOn.value = ok;
    emit('notify', ok ? 'Notificaciones push activadas' : (lastError.value || 'No se pudo activar'), ok ? 'success' : 'error');
  } else {
    const ok = await disablePush();
    localOn.value = !ok ? true : false;
    emit('notify', ok ? 'Notificaciones push desactivadas' : (lastError.value || 'No se pudo desactivar'), ok ? 'success' : 'error');
  }
}
</script>

<template>
  <v-card
    variant="outlined"
    class="push-opt-in"
    rounded="lg"
  >
    <v-card-title class="text-body-1 font-weight-medium d-flex align-center ga-2">
      <v-icon icon="mdi-bell-ring-outline" size="22" aria-hidden="true" />
      Avisos en el móvil
    </v-card-title>
    <v-card-text class="text-body-2" style="color: var(--tf-on-surface-muted)">
      <template v-if="!supported">
        Este navegador no permite notificaciones push. En iPhone, añade Trainfit a la
        pantalla de inicio y prueba de nuevo.
      </template>
      <template v-else-if="!enabledOnServer && !subscribed">
        Las notificaciones push aún no están configuradas en el servidor (claves VAPID).
        Puedes seguir usando la campana dentro de la app.
      </template>
      <template v-else>
        Recibe avisos aunque no tengas Trainfit abierta: rutinas, dieta, récords y mensajes.
      </template>
    </v-card-text>
    <v-card-actions class="px-4 pb-4">
      <v-switch
        :model-value="localOn"
        :disabled="!supported || busy || (!enabledOnServer && !subscribed)"
        :loading="busy"
        color="primary"
        hide-details
        density="comfortable"
        label="Activar notificaciones push"
        aria-label="Activar notificaciones push"
        @update:model-value="onToggle"
      />
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.push-opt-in {
  border-color: rgba(255, 255, 255, 0.12);
  background: transparent;
}
</style>
