<script setup>
/**
 * Toggle to enable/disable Web Push (Feature 051).
 * Optional client workout-reminder hour (GET/PUT /me/notification-settings).
 */
import { computed, onMounted, shallowRef, watch } from 'vue';
import { usePushNotifications } from '../composables/usePushNotifications.js';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '../api/notificationSettingsApi.js';
import { getApiErrorMessage } from '../api/http.js';

const props = defineProps({
  /** When true (client profile), show workout reminder switch + hour. */
  showWorkoutReminder: {
    type: Boolean,
    default: false,
  },
});

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

const reminderEnabled = shallowRef(false);
const reminderHour = shallowRef(8);
const reminderBusy = shallowRef(false);
const reminderLoaded = shallowRef(false);

const hourOptions = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 5; // 5–22
  const label = `${String(hour).padStart(2, '0')}:00`;
  return { title: label, value: hour };
});

const isIos = computed(() => detectIos());
const isStandalone = computed(() => detectStandalone());
const showIosGuide = computed(() => isIos.value && !isStandalone.value);

const statusCopy = computed(() => {
  if (!supported.value) {
    return 'Este navegador no permite avisos push. En iPhone, añade Trainfit a la pantalla de inicio.';
  }
  if (!enabledOnServer.value && !subscribed.value) {
    return 'Los avisos push aún no están disponibles en el servidor. La campana de la app sigue funcionando.';
  }
  return 'Rutinas, dieta, récords y mensajes, aunque tengas Trainfit cerrada.';
});

const pushDisabled = computed(
  () => !supported.value || busy.value || (!enabledOnServer.value && !subscribed.value),
);

onMounted(async () => {
  await refreshSubscriptionState();
  await checkServerEnabled();
  localOn.value = subscribed.value;
  if (props.showWorkoutReminder) {
    await loadReminderSettings();
  }
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

async function loadReminderSettings() {
  try {
    const { data } = await getNotificationSettings();
    const settings = data?.data ?? data ?? {};
    reminderEnabled.value = Boolean(
      settings.workout_reminder_enabled ?? settings.workoutReminderEnabled,
    );
    const hour = Number(settings.workout_reminder_hour ?? settings.workoutReminderHour);
    if (Number.isFinite(hour) && hour >= 0 && hour <= 23) {
      reminderHour.value = Math.min(22, Math.max(5, hour));
    }
    reminderLoaded.value = true;
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.warn('[PushOptInCard] notification-settings load failed', error);
    }
    reminderLoaded.value = true;
  }
}

async function persistReminderSettings(partial) {
  if (!props.showWorkoutReminder || reminderBusy.value) return;
  reminderBusy.value = true;
  try {
    await updateNotificationSettings({
      workout_reminder_enabled: reminderEnabled.value,
      workout_reminder_hour: reminderHour.value,
      ...partial,
    });
  } catch (error) {
    if (error?.response?.status === 404) {
      return;
    }
    emit('notify', getApiErrorMessage(error, 'No se pudieron guardar los recordatorios'), 'error');
  } finally {
    reminderBusy.value = false;
  }
}

async function onReminderToggle(value) {
  reminderEnabled.value = Boolean(value);
  await persistReminderSettings({ workout_reminder_enabled: reminderEnabled.value });
  if (reminderEnabled.value) {
    emit('notify', 'Recordatorio de entrenamiento activado', 'success');
  }
}

async function onReminderHourChange(value) {
  const hour = Number(value);
  if (!Number.isFinite(hour)) return;
  reminderHour.value = hour;
  await persistReminderSettings({ workout_reminder_hour: hour });
}

function detectIos() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return navigator.platform === 'MacIntel' && Number(navigator.maxTouchPoints || 0) > 1;
}

function detectStandalone() {
  if (typeof window === 'undefined') return false;
  if (window.navigator?.standalone === true) return true;
  try {
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}
</script>

<template>
  <section class="tf-alerts" aria-labelledby="tf-alerts-title">
    <header class="tf-alerts__header">
      <div class="tf-alerts__intro">
        <h2 id="tf-alerts-title" class="tf-alerts__title">
          Avisos en el móvil
        </h2>
        <p class="tf-alerts__subtitle">
          {{ statusCopy }}
        </p>
      </div>
    </header>

    <div
      v-if="showIosGuide"
      class="tf-alerts__tip"
      role="note"
    >
      <v-icon icon="mdi-apple" size="18" aria-hidden="true" />
      <p class="tf-alerts__tip-text">
        En iPhone: <strong>Compartir</strong> → <strong>Añadir a pantalla de inicio</strong>.
        Luego abre Trainfit desde el icono y activa los avisos.
      </p>
    </div>

    <div class="tf-alerts__list" role="list">
      <div class="tf-alerts__row" role="listitem">
        <div class="tf-alerts__row-copy">
          <p class="tf-alerts__row-title">Notificaciones push</p>
          <p class="tf-alerts__row-desc">
            Alertas del sistema aunque la app esté cerrada
          </p>
        </div>
        <v-switch
          :model-value="localOn"
          :disabled="pushDisabled"
          :loading="busy"
          color="primary"
          hide-details
          density="compact"
          class="tf-alerts__switch"
          aria-label="Activar notificaciones push"
          @update:model-value="onToggle"
        />
      </div>

      <template v-if="showWorkoutReminder && reminderLoaded">
        <div class="tf-alerts__row" role="listitem">
          <div class="tf-alerts__row-copy">
            <p class="tf-alerts__row-title">Recordatorio de entrenamiento</p>
            <p class="tf-alerts__row-desc">
              Si hoy tienes rutina, te avisamos a esa hora
            </p>
          </div>
          <v-switch
            :model-value="reminderEnabled"
            :disabled="reminderBusy"
            :loading="reminderBusy"
            color="primary"
            hide-details
            density="compact"
            class="tf-alerts__switch"
            aria-label="Recordatorio de entrenamiento"
            @update:model-value="onReminderToggle"
          />
        </div>

        <div
          v-if="reminderEnabled"
          class="tf-alerts__hour"
        >
          <label class="tf-alerts__hour-label" for="tf-reminder-hour">
            Hora
          </label>
          <v-select
            id="tf-reminder-hour"
            :model-value="reminderHour"
            :items="hourOptions"
            :disabled="reminderBusy"
            variant="solo-filled"
            density="comfortable"
            hide-details
            flat
            class="tf-alerts__hour-select"
            :menu-props="{ contentClass: 'tf-overlay-menu' }"
            aria-label="Hora del recordatorio de entrenamiento"
            @update:model-value="onReminderHourChange"
          />
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.tf-alerts {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%),
    #151820;
  padding: 1.1rem 1.1rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.tf-alerts__header {
  display: block;
}

.tf-alerts__intro {
  min-width: 0;
}

.tf-alerts__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  line-height: 1.3;
  color: var(--tf-on-surface, #e8ecf1);
}

.tf-alerts__subtitle {
  margin: 0.3rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-alerts__tip {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.7rem 0.8rem;
  border-radius: 12px;
  background: rgba(0, 229, 255, 0.06);
  border: 1px solid rgba(0, 229, 255, 0.14);
  color: var(--tf-primary, #00e5ff);
}

.tf-alerts__tip-text {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--tf-on-surface, #e8ecf1);
}

.tf-alerts__tip-text strong {
  font-weight: 650;
  color: var(--tf-on-surface, #e8ecf1);
}

.tf-alerts__list {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.tf-alerts__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  min-height: 64px;
  padding: 0.85rem 0.95rem;
}

.tf-alerts__row + .tf-alerts__row,
.tf-alerts__row + .tf-alerts__hour {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.tf-alerts__row-copy {
  min-width: 0;
  flex: 1;
}

.tf-alerts__row-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--tf-on-surface, #e8ecf1);
}

.tf-alerts__row-desc {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-alerts__switch {
  flex-shrink: 0;
  margin-inline-end: 0;
}

.tf-alerts__switch :deep(.v-selection-control) {
  min-height: 44px;
}

.tf-alerts__hour {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.65rem 0.95rem 0.9rem;
}

.tf-alerts__hour-label {
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-weight: 550;
  color: var(--tf-on-surface-muted, #a8b0bc);
  min-width: 2.5rem;
}

.tf-alerts__hour-select {
  flex: 1;
  max-width: 9rem;
  margin-left: auto;
}

.tf-alerts__hour-select :deep(.v-field) {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: none !important;
  min-height: 44px;
}

.tf-alerts__hour-select :deep(.v-field__overlay) {
  opacity: 0 !important;
}

.tf-alerts__hour-select :deep(.v-field__outline) {
  display: none;
}

.tf-alerts__hour-select:focus-within :deep(.v-field) {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: var(--tf-focus-offset, 2px);
}
</style>
