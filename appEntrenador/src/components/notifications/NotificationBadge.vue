<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    location="bottom end"
    offset="8"
    content-class="tf-overlay-menu tf-notif-menu"
  >
    <template #activator="{ props: menuProps }">
      <button
        type="button"
        class="notification-btn"
        v-bind="menuProps"
        aria-label="Notificaciones"
      >
        <v-icon icon="mdi-bell-outline" size="20" color="var(--tf-on-surface-muted, #a8b0bc)" />
        <span
          v-if="unreadCount > 0"
          class="notification-btn__dot"
          aria-hidden="true"
        />
      </button>
    </template>

    <div class="tf-notif-panel">
      <header class="tf-notif-panel__header">
        <div>
          <h3 class="tf-notif-panel__title">Notificaciones</h3>
          <p class="tf-notif-panel__subtitle">
            {{ unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día' }}
          </p>
        </div>
        <button
          v-if="unreadCount > 0"
          type="button"
          class="tf-notif-panel__action"
          @click="markAllAsRead"
        >
          Marcar leídas
        </button>
      </header>

      <div v-if="isLoading && notifications.length === 0" class="tf-notif-panel__empty">
        <v-progress-circular indeterminate size="22" width="2" color="primary" />
      </div>

      <div v-else-if="notifications.length === 0" class="tf-notif-panel__empty">
        <div class="tf-notif-panel__empty-icon">
          <v-icon icon="mdi-bell-check-outline" size="22" color="var(--tf-on-surface-muted, #a8b0bc)" />
        </div>
        <p class="tf-notif-panel__empty-title">Sin novedades</p>
        <p class="tf-notif-panel__empty-desc">
          Aquí verás alertas de rutinas y entrenamientos.
        </p>
      </div>

      <ul v-else class="tf-notif-panel__list">
        <li
          v-for="notif in notifications"
          :key="notif.id"
          class="tf-notif-panel__item"
          :class="{ 'tf-notif-panel__item--unread': !notif.is_read }"
        >
          <button
            type="button"
            class="tf-notif-panel__item-btn"
            @click="handleNotificationClick(notif)"
          >
            <div
              class="tf-notif-panel__icon"
              :class="`tf-notif-panel__icon--${notif.type || 'system'}`"
            >
              <v-icon :icon="getIcon(notif.type)" size="18" />
            </div>
            <div class="tf-notif-panel__body">
              <div class="tf-notif-panel__row">
                <span class="tf-notif-panel__item-title">{{ notif.title }}</span>
                <span class="tf-notif-panel__time">{{ formatDate(notif.created_at) }}</span>
              </div>
              <p class="tf-notif-panel__message">{{ notif.message }}</p>
            </div>
            <span
              v-if="!notif.is_read"
              class="tf-notif-panel__unread-dot"
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>
    </div>
  </v-menu>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useNotifications } from '../../composables/useNotifications.js';

const menu = ref(false);
const {
  notifications,
  unreadCount,
  isLoading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} = useNotifications();

onMounted(() => {
  fetchNotifications();
});

watch(menu, (open) => {
  if (open) fetchNotifications();
});

const getIcon = (type) => {
  switch (type) {
    case 'routine_assigned':
      return 'mdi-clipboard-text-outline';
    case 'routine_completed':
      return 'mdi-check-circle-outline';
    default:
      return 'mdi-information-outline';
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const handleNotificationClick = async (notif) => {
  if (!notif.is_read) {
    await markAsRead(notif.id);
  }
};
</script>

<style scoped>
.notification-btn {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #13161D;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
  padding: 0;
}

.notification-btn:hover {
  background: #171B23;
}

.notification-btn__dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef5350;
  border: 1.5px solid #13161D;
}
</style>

<!-- Panel teleported: estilos globales con prefijo tf-notif -->
<style>
.tf-notif-menu {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45) !important;
}

.tf-notif-menu .v-overlay__content,
.v-overlay-container .tf-notif-menu {
  border-radius: 16px !important;
}

.tf-notif-panel {
  width: min(340px, calc(100vw - 24px));
  max-height: 420px;
  display: flex;
  flex-direction: column;
  background: #13161D;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.tf-notif-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.tf-notif-panel__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #ffffff;
  line-height: 1.3;
}

.tf-notif-panel__subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.3;
}

.tf-notif-panel__action {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: #00E5FF;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
}

.tf-notif-panel__action:hover {
  text-decoration: underline;
}

.tf-notif-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 32px 24px;
  text-align: center;
}

.tf-notif-panel__empty-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.tf-notif-panel__empty-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.tf-notif-panel__empty-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
  max-width: 220px;
}

.tf-notif-panel__list {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  max-height: 340px;
}

.tf-notif-panel__item {
  border-radius: 12px;
}

.tf-notif-panel__item-btn {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;
}

.tf-notif-panel__item-btn:hover {
  background: rgba(0, 229, 255, 0.06);
}

.tf-notif-panel__item--unread .tf-notif-panel__item-btn {
  background: rgba(0, 229, 255, 0.04);
}

.tf-notif-panel__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-notif-panel__icon--routine_assigned {
  background: rgba(0, 229, 255, 0.12);
  color: #00E5FF;
}

.tf-notif-panel__icon--routine_completed {
  background: rgba(0, 230, 118, 0.12);
  color: #00E676;
}

.tf-notif-panel__body {
  flex: 1;
  min-width: 0;
}

.tf-notif-panel__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}

.tf-notif-panel__item-title {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.3;
}

.tf-notif-panel__time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-notif-panel__message {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--tf-on-surface-muted, #a8b0bc);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tf-notif-panel__unread-dot {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  margin-top: 6px;
  border-radius: 50%;
  background: #00E5FF;
}
</style>
