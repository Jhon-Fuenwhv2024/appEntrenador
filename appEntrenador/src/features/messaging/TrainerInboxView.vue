<script setup>
/**
 * Trainer inbox: modern client list + chat thread split.
 * Feature 073: unread counts, preview, sort unread-first.
 */
import { computed, onMounted, ref, shallowRef } from 'vue';
import { useDisplay } from 'vuetify';
import { useRouter } from 'vue-router';
import { getApiErrorMessage } from '../../shared/api/http.js';
import { getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';
import TfAvatar from '../../shared/components/TfAvatar.vue';
import { getClients } from '../trainer/api/clientsApi.js';
import ChatThread from './components/ChatThread.vue';
import { useUnreadMessages } from './composables/useUnreadMessages.js';

const router = useRouter();
const { mdAndUp } = useDisplay();

const loading = shallowRef(true);
const clients = ref([]);
const selectedClientId = shallowRef(null);
const mobileShowChat = shallowRef(false);
const loadError = shallowRef('');
const searchQuery = shallowRef('');

const { unreadByPartnerId, total: unreadTotal, refresh: refreshUnread } = useUnreadMessages({
  autoStart: false,
});

const selectedClient = computed(() =>
  clients.value.find((c) => Number(c.id) === Number(selectedClientId.value)) || null,
);

const showListPane = computed(() => mdAndUp.value || !mobileShowChat.value);
const showChatPane = computed(() => mdAndUp.value || mobileShowChat.value);

const sortedClients = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const list = clients.value.filter((client) => {
    if (!q) return true;
    const name = String(client.nombre || '').toLowerCase();
    const username = String(client.username || '').toLowerCase();
    return name.includes(q) || username.includes(q);
  });

  list.sort((a, b) => {
    const ua = unreadByPartnerId.value.get(Number(a.id));
    const ub = unreadByPartnerId.value.get(Number(b.id));
    const ca = ua?.count || 0;
    const cb = ub?.count || 0;

    if (ca > 0 && cb === 0) return -1;
    if (cb > 0 && ca === 0) return 1;

    if (ca > 0 && cb > 0) {
      const ta = new Date(ua.lastMessageAt).getTime() || 0;
      const tb = new Date(ub.lastMessageAt).getTime() || 0;
      if (tb !== ta) return tb - ta;
    }

    return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', {
      sensitivity: 'base',
    });
  });
  return list;
});

const formatRelativeTime = (iso) => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return 'ahora';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} d`;

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(then));
};

const unreadBadgeLabel = (count) => {
  const n = Number(count) || 0;
  if (n <= 0) return '';
  if (n > 99) return '99+';
  return String(n);
};

const getUnread = (client) => unreadByPartnerId.value.get(Number(client.id)) || null;

const clientSubtitle = (client) => {
  const unread = getUnread(client);
  if (unread?.preview) return unread.preview;
  return client.username ? `@${client.username}` : 'Sin mensajes recientes';
};

const clientInitial = (client) => {
  const name = String(client?.nombre || '?').trim();
  return name.charAt(0).toUpperCase() || '?';
};

const hasClientPhoto = (client) => {
  const url = String(client?.foto_url || '').trim();
  return Boolean(url) && url !== 'default_avatar.png';
};

const rowAriaLabel = (client) => {
  const unread = getUnread(client);
  const count = unread?.count || 0;
  if (count <= 0) return `Abrir chat con ${client.nombre}`;
  if (count === 1) return `Abrir chat con ${client.nombre}, 1 mensaje sin leer`;
  return `Abrir chat con ${client.nombre}, ${count} mensajes sin leer`;
};

const loadClients = async () => {
  loading.value = true;
  loadError.value = '';

  try {
    const response = await getClients();
    clients.value = response.data?.clients ?? [];
  } catch (error) {
    console.error('Error cargando alumnos para inbox:', error);
    clients.value = [];
    loadError.value = getApiErrorMessage(error, 'No se pudieron cargar los alumnos');
  } finally {
    loading.value = false;
  }

  try {
    await refreshUnread();
  } catch (error) {
    console.error('Error cargando resumen de no leídos:', error);
  }
};

const selectClient = (client) => {
  if (!client?.id) return;
  selectedClientId.value = Number(client.id);
  mobileShowChat.value = true;
};

const backToList = () => {
  mobileShowChat.value = false;
  refreshUnread();
};

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'trainer') {
    router.push('/');
    return;
  }
  loadClients();
});
</script>

<template>
  <AppShell role="trainer" active="messages">
    <div class="trainer-inbox">
      <aside
        v-show="showListPane"
        class="trainer-inbox__aside"
      >
        <header class="trainer-inbox__aside-header">
          <div class="trainer-inbox__heading">
            <div>
              <h1 class="trainer-inbox__title">Mensajes</h1>
              <p class="trainer-inbox__subtitle">
                {{ clients.length }} {{ clients.length === 1 ? 'alumno' : 'alumnos' }}
                <template v-if="unreadTotal > 0">
                  · {{ unreadTotal > 99 ? '99+' : unreadTotal }} sin leer
                </template>
              </p>
            </div>
          </div>

          <label class="trainer-inbox__search">
            <v-icon
              icon="mdi-magnify"
              size="18"
              class="trainer-inbox__search-icon"
              aria-hidden="true"
            />
            <input
              v-model="searchQuery"
              type="search"
              class="trainer-inbox__search-input"
              placeholder="Buscar alumno…"
              autocomplete="off"
              aria-label="Buscar alumno"
            >
          </label>
        </header>

        <v-alert
          v-if="loadError"
          type="error"
          variant="tonal"
          density="compact"
          class="ma-3"
        >
          {{ loadError }}
        </v-alert>

        <div v-if="loading" class="trainer-inbox__loading">
          <v-progress-circular indeterminate color="primary" size="32" />
        </div>

        <div v-else class="trainer-inbox__list" role="list">
          <button
            v-for="client in sortedClients"
            :key="client.id"
            type="button"
            class="trainer-inbox__row"
            :class="{
              'trainer-inbox__row--active': Number(client.id) === Number(selectedClientId),
              'trainer-inbox__row--unread': (getUnread(client)?.count || 0) > 0,
            }"
            role="listitem"
            :aria-label="rowAriaLabel(client)"
            :aria-current="Number(client.id) === Number(selectedClientId) ? 'true' : undefined"
            @click="selectClient(client)"
          >
            <div
              class="trainer-inbox__avatar"
              :class="{ 'trainer-inbox__avatar--photo': hasClientPhoto(client) }"
              aria-hidden="true"
            >
              <TfAvatar
                :foto-url="client.foto_url || ''"
                fallback="initials"
                :initials="clientInitial(client)"
                img-class="trainer-inbox__avatar-img"
              />
            </div>

            <div class="trainer-inbox__body">
              <div class="trainer-inbox__row-top">
                <span class="trainer-inbox__name">{{ client.nombre }}</span>
                <span
                  v-if="getUnread(client)?.lastMessageAt"
                  class="trainer-inbox__time"
                >
                  {{ formatRelativeTime(getUnread(client).lastMessageAt) }}
                </span>
              </div>
              <div class="trainer-inbox__row-bottom">
                <span class="trainer-inbox__preview">{{ clientSubtitle(client) }}</span>
                <span
                  v-if="(getUnread(client)?.count || 0) > 0"
                  class="trainer-inbox__unread-badge"
                  aria-hidden="true"
                >
                  {{ unreadBadgeLabel(getUnread(client).count) }}
                </span>
              </div>
            </div>
          </button>

          <div
            v-if="!sortedClients.length"
            class="trainer-inbox__empty"
          >
            <div class="trainer-inbox__empty-icon" aria-hidden="true">
              <v-icon
                :icon="clients.length ? 'mdi-account-search-outline' : 'mdi-account-group-outline'"
                size="22"
              />
            </div>
            <p class="trainer-inbox__empty-title">
              {{ clients.length ? 'Sin resultados' : 'Aún no tienes alumnos' }}
            </p>
            <p class="trainer-inbox__empty-desc">
              {{
                clients.length
                  ? 'Prueba con otro nombre o usuario.'
                  : 'Cuando invites alumnos, aparecerán aquí para chatear.'
              }}
            </p>
          </div>
        </div>
      </aside>

      <section
        v-show="showChatPane"
        class="trainer-inbox__chat"
      >
        <div v-if="!mdAndUp && selectedClient" class="trainer-inbox__mobile-bar">
          <button
            type="button"
            class="trainer-inbox__back"
            aria-label="Volver a la lista"
            @click="backToList"
          >
            <v-icon icon="mdi-arrow-left" size="20" />
          </button>
          <span class="trainer-inbox__mobile-name">{{ selectedClient.nombre }}</span>
        </div>

        <ChatThread
          v-if="selectedClientId"
          :key="selectedClientId"
          :partner-id="selectedClientId"
          :partner-name="selectedClient?.nombre || ''"
          :partner-foto-url="selectedClient?.foto_url || ''"
        />

        <div v-else class="trainer-inbox__placeholder">
          <div class="trainer-inbox__placeholder-card">
            <div class="trainer-inbox__placeholder-icon" aria-hidden="true">
              <v-icon icon="mdi-message-text-outline" size="26" />
            </div>
            <p class="trainer-inbox__placeholder-title">Elige una conversación</p>
            <p class="trainer-inbox__placeholder-desc">
              Selecciona un alumno a la izquierda para abrir el chat.
            </p>
          </div>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.trainer-inbox {
  display: flex;
  /* Llenar .shell-body (el padding-bottom del shell deja hueco para la nav). */
  flex: 1 1 auto;
  align-self: stretch;
  width: 100%;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #0d1017;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
}

.trainer-inbox__aside {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  min-height: 0;
  background:
    linear-gradient(180deg, rgba(17, 20, 28, 0.98) 0%, rgba(13, 16, 23, 1) 100%);
}

@media (min-width: 960px) {
  .trainer-inbox__aside {
    width: 340px;
    max-width: 38%;
    flex-shrink: 0;
  }
}

.trainer-inbox__aside-header {
  padding: 1.05rem 1rem 0.9rem;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.trainer-inbox__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #f4f6f8;
}

.trainer-inbox__subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.trainer-inbox__search {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 40px;
  padding: 0 0.75rem;
  border-radius: 12px;
  background: #12151d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.trainer-inbox__search:focus-within {
  border-color: rgba(0, 229, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.1);
}

.trainer-inbox__search-icon {
  color: var(--tf-on-surface-muted, #a8b0bc);
  flex-shrink: 0;
}

.trainer-inbox__search-input {
  flex: 1;
  min-width: 0;
  height: 38px;
  border: none;
  outline: transparent;
  background: transparent;
  color: #f4f6f8;
  font: inherit;
  font-size: 0.9rem;
}

.trainer-inbox__search-input::placeholder {
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.trainer-inbox__search-input:focus-visible {
  outline: none;
}

.trainer-inbox__list {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 0.55rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.trainer-inbox__list::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.trainer-inbox__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trainer-inbox__row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.7rem;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease;
}

.trainer-inbox__row:hover {
  background: rgba(255, 255, 255, 0.035);
}

.trainer-inbox__row:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: 2px;
}

.trainer-inbox__row--active {
  background: rgba(0, 229, 255, 0.08);
  border-color: rgba(0, 229, 255, 0.18);
}

.trainer-inbox__row--unread .trainer-inbox__name {
  font-weight: 700;
  color: #ffffff;
}

.trainer-inbox__row--unread .trainer-inbox__preview {
  color: #d7dde5;
}

.trainer-inbox__avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.2);
  overflow: hidden;
}

.trainer-inbox__avatar--photo {
  color: transparent;
  background: #171b24;
  border-color: rgba(255, 255, 255, 0.08);
}

.trainer-inbox__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.trainer-inbox__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.trainer-inbox__row-top,
.trainer-inbox__row-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.trainer-inbox__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.92rem;
  font-weight: 600;
  color: #eef1f4;
}

.trainer-inbox__preview {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.78rem;
  line-height: 1.3;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.trainer-inbox__time {
  flex-shrink: 0;
  font-size: 0.68rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  white-space: nowrap;
}

.trainer-inbox__unread-badge {
  flex-shrink: 0;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

.trainer-inbox__empty {
  margin: auto;
  padding: 2rem 1.25rem;
  text-align: center;
  max-width: 16rem;
}

.trainer-inbox__empty-icon,
.trainer-inbox__placeholder-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 0.85rem;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--tf-on-surface-muted, #a8b0bc);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.trainer-inbox__empty-title,
.trainer-inbox__placeholder-title {
  margin: 0 0 0.3rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f4f6f8;
}

.trainer-inbox__empty-desc,
.trainer-inbox__placeholder-desc {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.trainer-inbox__chat {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #0d1017;
}

.trainer-inbox__mobile-bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.65rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(17, 20, 28, 0.92);
  flex-shrink: 0;
}

.trainer-inbox__back {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #eef1f4;
  cursor: pointer;
}

.trainer-inbox__back:hover {
  background: rgba(255, 255, 255, 0.05);
}

.trainer-inbox__back:focus-visible {
  outline: var(--tf-focus-ring, 2px solid #00e5ff);
  outline-offset: 2px;
}

.trainer-inbox__mobile-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f4f6f8;
}

.trainer-inbox__placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 18px 18px;
}

.trainer-inbox__placeholder-card {
  max-width: 18rem;
}
</style>
