<script setup>
/**
 * Feature 076 — modo sombra en el header (junto a notificaciones).
 * Icon-button + menú: lista live y composer de cues.
 */
import { computed, onMounted, onUnmounted, reactive, shallowRef, watch } from 'vue';
import { getApiErrorMessage } from '../../../shared/api/http.js';
import {
  getTrainerLiveSessions,
  postLiveCue,
} from '../api/shadowModeApi.js';

/** Solo con menú abierto o alumnos en vivo (ahorra Upstash free). */
const POLL_ACTIVE_MS = 8000;
const TONES = [
  { title: 'Pista', value: 'tip' },
  { title: 'Forma', value: 'form' },
  { title: 'Motivación', value: 'motivation' },
  { title: 'Atención', value: 'stop' },
];

const menu = shallowRef(false);
const sessions = shallowRef([]);
const loading = shallowRef(false);
const loadError = shallowRef('');
const selectedId = shallowRef(null);
const sending = shallowRef(false);
const available = shallowRef(true);

const form = reactive({
  body: '',
  tone: 'tip',
});

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

let pollTimer = null;

const liveCount = computed(() => sessions.value.length);

const selected = computed(() => (
  sessions.value.find((s) => Number(s.clientId) === Number(selectedId.value)) || null
));

const phaseLabel = computed(() => {
  if (!selected.value) return '';
  return selected.value.phase === 'resting' ? 'Descanso' : 'Serie';
});

const restLeftLabel = computed(() => {
  const iso = selected.value?.restEndsAt;
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  const secs = Math.ceil(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
});

const ariaLabel = computed(() => {
  if (!available.value) return 'Modo sombra no disponible';
  if (liveCount.value === 0) return 'Modo sombra: ningún alumno entrenando';
  if (liveCount.value === 1) return 'Modo sombra: 1 alumno en vivo';
  return `Modo sombra: ${liveCount.value} alumnos en vivo`;
});

const subtitle = computed(() => {
  if (!available.value) return 'Redis no configurado';
  if (loadError.value) return loadError.value;
  if (loading.value && liveCount.value === 0) return 'Comprobando…';
  if (liveCount.value === 0) return 'Nadie entrenando ahora';
  if (liveCount.value === 1) return '1 alumno en vivo';
  return `${liveCount.value} alumnos en vivo`;
});

function notify(text, color = 'success') {
  snackbar.show = true;
  snackbar.text = text;
  snackbar.color = color;
}

async function loadSessions({ silent = false } = {}) {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return;
  }
  if (!silent) loading.value = true;
  try {
    loadError.value = '';
    const response = await getTrainerLiveSessions();
    available.value = true;
    const list = Array.isArray(response.data?.data) ? response.data.data : [];
    sessions.value = list;
    if (selectedId.value != null) {
      const still = list.some((s) => Number(s.clientId) === Number(selectedId.value));
      if (!still) selectedId.value = list[0]?.clientId ?? null;
    } else if (list.length >= 1) {
      selectedId.value = list[0].clientId;
    }
  } catch (error) {
    const code = error?.response?.status;
    if (code === 503) {
      available.value = false;
      loadError.value = 'No disponible';
      sessions.value = [];
    } else {
      loadError.value = getApiErrorMessage(error, 'Error al cargar');
    }
  } finally {
    loading.value = false;
  }
}

function selectClient(clientId) {
  selectedId.value = clientId;
  form.body = '';
  form.tone = 'tip';
}

async function sendCue() {
  if (!selected.value || sending.value) return;
  const body = form.body.trim();
  if (!body) {
    notify('Escribe una pista corta', 'error');
    return;
  }
  if (body.length > 120) {
    notify('Máximo 120 caracteres', 'error');
    return;
  }
  sending.value = true;
  try {
    await postLiveCue(selected.value.clientId, {
      body,
      tone: form.tone,
    });
    form.body = '';
    notify('Pista enviada');
    await loadSessions({ silent: true });
  } catch (error) {
    notify(getApiErrorMessage(error, 'No se pudo enviar'), 'error');
  } finally {
    sending.value = false;
  }
}

function shouldPoll() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return false;
  }
  // Idle sin alumnos: 0 comandos Redis hasta abrir el menú o volver a la pestaña.
  return menu.value || sessions.value.length > 0;
}

function schedulePoll() {
  stopPoll();
  if (!shouldPoll()) return;
  pollTimer = setInterval(() => {
    loadSessions({ silent: true });
  }, POLL_ACTIVE_MS);
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function onVisibility() {
  if (document.visibilityState === 'visible') {
    // Un check al volver a la pestaña (no interval si sigue vacío).
    loadSessions({ silent: true }).then(() => schedulePoll());
  } else {
    stopPoll();
  }
}

watch(menu, (open) => {
  if (open) {
    loadSessions({ silent: true }).then(() => schedulePoll());
  } else {
    schedulePoll();
  }
});

watch(liveCount, () => {
  schedulePoll();
});

watch(selectedId, () => {
  form.body = '';
});

onMounted(async () => {
  await loadSessions();
  schedulePoll();
  document.addEventListener('visibilitychange', onVisibility);
});

onUnmounted(() => {
  stopPoll();
  document.removeEventListener('visibilitychange', onVisibility);
});
</script>

<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    location="bottom end"
    offset="8"
    content-class="tf-overlay-menu tf-shadow-menu"
  >
    <template #activator="{ props: menuProps }">
      <button
        type="button"
        class="shadow-btn"
        :class="{ 'shadow-btn--live': liveCount > 0 }"
        v-bind="menuProps"
        :aria-label="ariaLabel"
      >
        <v-icon
          icon="mdi-account-eye-outline"
          size="20"
          :color="liveCount > 0 ? 'rgb(var(--v-theme-primary))' : 'var(--tf-on-surface-muted, #a8b0bc)'"
        />
        <span
          v-if="liveCount > 0"
          class="shadow-btn__badge"
          aria-hidden="true"
        >
          {{ liveCount > 9 ? '9+' : liveCount }}
        </span>
      </button>
    </template>

    <div class="tf-shadow-panel">
      <header class="tf-shadow-panel__header">
        <div class="tf-shadow-panel__heading">
          <h3 class="tf-shadow-panel__title">Modo sombra</h3>
          <p class="tf-shadow-panel__subtitle">{{ subtitle }}</p>
        </div>
        <v-progress-circular
          v-if="loading"
          indeterminate
          size="16"
          width="2"
          color="primary"
          aria-label="Actualizando"
        />
      </header>

      <div
        v-if="!available"
        class="tf-shadow-panel__empty"
      >
        <p class="tf-shadow-panel__empty-title">No disponible</p>
        <p class="tf-shadow-panel__empty-desc">
          Configura Redis para ver alumnos en vivo.
        </p>
      </div>

      <div
        v-else-if="liveCount === 0"
        class="tf-shadow-panel__empty"
      >
        <div class="tf-shadow-panel__empty-icon">
          <v-icon
            icon="mdi-account-eye-outline"
            size="22"
            color="var(--tf-on-surface-muted, #a8b0bc)"
          />
        </div>
        <p class="tf-shadow-panel__empty-title">Sin alumnos en vivo</p>
        <p class="tf-shadow-panel__empty-desc">
          Cuando un alumno entrena con sombra activa, aparece aquí para enviarle pistas.
        </p>
      </div>

      <div
        v-else
        class="tf-shadow-panel__body"
      >
        <ul class="tf-shadow-panel__list" role="list">
          <li
            v-for="item in sessions"
            :key="item.clientId"
          >
            <button
              type="button"
              class="tf-shadow-panel__item"
              :class="{ 'tf-shadow-panel__item--active': Number(selectedId) === Number(item.clientId) }"
              @click="selectClient(item.clientId)"
            >
              <span class="tf-shadow-panel__dot" aria-hidden="true" />
              <span class="tf-shadow-panel__item-text">
                <strong>{{ item.clientName }}</strong>
                <span>
                  {{ item.exerciseName }} · serie {{ Number(item.setIndex) + 1 }}
                </span>
              </span>
            </button>
          </li>
        </ul>

        <div
          v-if="selected"
          class="tf-shadow-panel__composer"
        >
          <p class="tf-shadow-panel__meta">
            {{ selected.exerciseName }}
            · {{ phaseLabel }}
            <template v-if="selected.phase === 'resting' && restLeftLabel">
              · {{ restLeftLabel }}
            </template>
          </p>
          <v-textarea
            v-model="form.body"
            label="Pista"
            rows="2"
            maxlength="120"
            counter="120"
            variant="outlined"
            density="compact"
            hide-details="auto"
            :disabled="sending"
          />
          <div class="tf-shadow-panel__row">
            <v-select
              v-model="form.tone"
              :items="TONES"
              label="Tono"
              variant="outlined"
              density="compact"
              hide-details
              :menu-props="{ contentClass: 'tf-overlay-menu' }"
              :disabled="sending"
            />
            <v-btn
              color="primary"
              :loading="sending"
              :disabled="!form.body.trim()"
              @click="sendCue"
            >
              Enviar
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </v-menu>

  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    timeout="2800"
  >
    {{ snackbar.text }}
  </v-snackbar>
</template>

<style scoped>
.shadow-btn {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #13161d;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  padding: 0;
}

.shadow-btn:hover {
  background: #171b23;
}

.shadow-btn--live {
  border-color: color-mix(in srgb, rgb(var(--v-theme-primary)) 45%, transparent);
}

.shadow-btn:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
}

.shadow-btn__badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #00e5ff;
  border: 1.5px solid #13161d;
  color: #0b0d12;
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 15px;
  text-align: center;
}
</style>

<style>
.tf-shadow-menu {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45) !important;
}

.tf-shadow-menu .v-overlay__content,
.v-overlay-container .tf-shadow-menu {
  border-radius: 16px !important;
  width: auto !important;
  max-width: calc(100vw - 1.5rem) !important;
  max-height: min(70dvh, 28rem) !important;
}

.tf-shadow-panel {
  width: min(22.5rem, calc(100vw - 1.5rem));
  max-height: min(70dvh, 28rem);
  display: flex;
  flex-direction: column;
  background: #13161d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-sizing: border-box;
}

.tf-shadow-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem 0.65rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.tf-shadow-panel__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--tf-on-surface, #e8eaed);
}

.tf-shadow-panel__subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-shadow-panel__empty {
  padding: 1.25rem 1rem 1.35rem;
  text-align: center;
}

.tf-shadow-panel__empty-icon {
  display: inline-flex;
  margin-bottom: 0.5rem;
}

.tf-shadow-panel__empty-title {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--tf-on-surface, #e8eaed);
}

.tf-shadow-panel__empty-desc {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-shadow-panel__body {
  padding: 0.65rem 0.75rem 0.85rem;
  overflow-y: auto;
}

.tf-shadow-panel__list {
  list-style: none;
  margin: 0 0 0.65rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.tf-shadow-panel__item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  text-align: left;
  padding: 0.55rem 0.6rem;
  min-height: 2.5rem;
  border-radius: 0.65rem;
  border: 1px solid transparent;
  background: transparent;
  color: var(--tf-on-surface, #e8eaed);
  cursor: pointer;
}

.tf-shadow-panel__item:hover {
  background: rgba(0, 229, 255, 0.08);
}

.tf-shadow-panel__item--active {
  border-color: rgba(0, 229, 255, 0.4);
  background: rgba(0, 229, 255, 0.12);
}

.tf-shadow-panel__item:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
}

.tf-shadow-panel__dot {
  width: 0.45rem;
  height: 0.45rem;
  margin-top: 0.4rem;
  border-radius: 50%;
  background: #00e5ff;
  flex-shrink: 0;
}

.tf-shadow-panel__item-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-shadow-panel__item-text strong {
  font-size: 0.875rem;
  color: var(--tf-on-surface, #e8eaed);
}

.tf-shadow-panel__composer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.55rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.tf-shadow-panel__meta {
  margin: 0;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.35;
}

.tf-shadow-panel__row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: start;
}
</style>
