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
        :aria-label="notificationAriaLabel"
      >
        <v-icon icon="mdi-bell-outline" size="20" color="var(--tf-on-surface-muted, #a8b0bc)" />
        <span
          v-if="unreadCount > 0"
          class="notification-btn__badge"
        >
          {{ badgeLabel }}
        </span>
      </button>
    </template>

    <div class="tf-notif-panel">
      <header class="tf-notif-panel__header">
        <div class="tf-notif-panel__heading">
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
          Aquí verás alertas de rutinas, dieta, progreso, recordatorios, membresía y rachas.
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
                <span class="tf-notif-panel__time">{{ formatRelativeTime(notif.created_at) }}</span>
              </div>
              <p class="tf-notif-panel__message">{{ notif.message }}</p>
            </div>
            <span
              v-if="!notif.is_read"
              class="tf-notif-panel__unread-dot"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            class="tf-notif-panel__dismiss"
            :aria-label="`Descartar notificación: ${notif.title}`"
            @click.stop="handleDismiss(notif)"
          >
            <v-icon icon="mdi-close" size="16" />
          </button>
        </li>
      </ul>
    </div>
  </v-menu>

  <v-dialog
    v-model="detailOpen"
    max-width="440"
    content-class="tf-overlay-menu tf-notif-detail-dialog"
    scrim="rgba(0, 0, 0, 0.65)"
  >
    <div v-if="selectedNotif" class="tf-notif-detail" role="dialog" aria-modal="true">
      <header class="tf-notif-detail__header">
        <div
          class="tf-notif-detail__icon"
          :class="`tf-notif-panel__icon--${selectedNotif.type || 'system'}`"
        >
          <v-icon :icon="getIcon(selectedNotif.type)" size="28" />
        </div>
        <button
          type="button"
          class="tf-notif-detail__close"
          aria-label="Cerrar notificación"
          @click="closeDetail"
        >
          <v-icon icon="mdi-close" size="20" />
        </button>
      </header>

      <h2 class="tf-notif-detail__title">{{ selectedNotif.title }}</h2>
      <p class="tf-notif-detail__time">{{ formatRelativeTime(selectedNotif.created_at) }}</p>
      <p class="tf-notif-detail__message">{{ selectedNotif.message }}</p>

      <div class="tf-notif-detail__actions">
        <v-btn
          v-if="detailActionPath"
          color="primary"
          block
          class="tf-notif-detail__cta"
          @click="goToDetailAction"
        >
          Ver detalle
        </v-btn>
        <v-btn
          variant="text"
          block
          class="tf-notif-detail__secondary"
          @click="closeDetail"
        >
          Cerrar
        </v-btn>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useNotifications } from '../../composables/useNotifications.js';

const router = useRouter();
const menu = ref(false);
const detailOpen = ref(false);
const selectedNotif = ref(null);
const {
  notifications,
  unreadCount,
  isLoading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = useNotifications();

const badgeLabel = computed(() => {
  const count = Number(unreadCount.value) || 0;
  if (count > 99) return '99+';
  return String(count);
});

const notificationAriaLabel = computed(() => {
  const count = Number(unreadCount.value) || 0;
  if (count <= 0) return 'Notificaciones';
  if (count === 1) return 'Notificaciones, 1 sin leer';
  return `Notificaciones, ${count > 99 ? 'más de 99' : count} sin leer`;
});

const detailActionPath = computed(() =>
  safeInternalPath(selectedNotif.value?.action_url),
);

onMounted(() => {
  fetchNotifications();
});

watch(menu, (open) => {
  if (open) fetchNotifications();
});

watch(detailOpen, (open) => {
  if (!open) selectedNotif.value = null;
});

const getIcon = (type) => {
  switch (type) {
    case 'routine_assigned':
      return 'mdi-clipboard-text-outline';
    case 'routine_completed':
      return 'mdi-check-circle-outline';
    case 'diet_updated':
      return 'mdi-food-apple';
    case 'pr_achieved':
      return 'mdi-trophy-outline';
    case 'streak_milestone':
      return 'mdi-fire';
    case 'workout_reminder':
      return 'mdi-dumbbell';
    case 'membership_expiring':
    case 'membership_expired':
    case 'membership_grace':
      return 'mdi-card-account-details-outline';
    case 'gym_membership_expiring':
    case 'gym_membership_expired':
      return 'mdi-dumbbell';
    case 'streak_at_risk':
      return 'mdi-fire-alert';
    default:
      return 'mdi-information-outline';
  }
};

/** Solo paths internos relativos (evita open redirect). */
function safeInternalPath(url) {
  if (typeof url !== 'string') return null;
  const path = url.trim();
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  return path;
}

/** Relative time: Ahora / hace N min / ayer / short date. */
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfYesterday && date < startOfToday) return 'ayer';

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

const closeDetail = () => {
  detailOpen.value = false;
};

const handleNotificationClick = async (notif) => {
  if (!notif.is_read) {
    await markAsRead(notif.id);
  }
  selectedNotif.value = { ...notif, is_read: true };
  menu.value = false;
  detailOpen.value = true;
};

const goToDetailAction = () => {
  const path = detailActionPath.value;
  closeDetail();
  if (path) router.push(path);
};

const handleDismiss = async (notif) => {
  await deleteNotification(notif.id);
};
</script>

<style scoped>
.notification-btn {
  position: relative;
  width: 44px;
  height: 44px;
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

.notification-btn:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
}

.notification-btn__badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ef5350;
  border: 1.5px solid #13161d;
  color: #ffffff;
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 15px;
  text-align: center;
  letter-spacing: 0;
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
  width: auto !important;
  height: fit-content !important;
  max-width: calc(100vw - 1.5rem) !important;
  max-height: min(70dvh, 28rem) !important;
}

.tf-notif-panel {
  width: min(22.5rem, calc(100vw - 1.5rem));
  height: fit-content;
  max-height: min(70dvh, 28rem);
  display: flex;
  flex-direction: column;
  background: #13161D;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-sizing: border-box;
}

.tf-notif-panel__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
  flex: 0 0 auto;
  padding: 0.85rem 1rem 0.65rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

.tf-notif-panel__heading {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
}

.tf-notif-panel__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  color: var(--tf-on-surface, #e8ecf1);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.tf-notif-panel__subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.35;
}

.tf-notif-panel__action {
  flex: 0 0 auto;
  border: none;
  background: transparent;
  color: #00E5FF;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.15rem 0;
  min-height: 0;
  border-radius: 8px;
  white-space: nowrap;
  text-align: right;
  line-height: 1.3;
}

.tf-notif-panel__action:hover {
  text-decoration: underline;
}

.tf-notif-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 2.25rem 1.5rem;
  text-align: center;
}

.tf-notif-panel__empty-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.4rem;
}

.tf-notif-panel__empty-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--tf-on-surface, #e8ecf1);
}

.tf-notif-panel__empty-desc {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--tf-on-surface-muted, #a8b0bc);
  max-width: 16rem;
  overflow-wrap: anywhere;
}

.tf-notif-panel__list {
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  overflow-y: auto;
  flex: 0 1 auto;
  max-height: min(50dvh, 20rem);
}

.tf-notif-panel__item {
  position: relative;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  height: auto;
}

.tf-notif-panel__item-btn {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  height: auto;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 2.5rem 0.75rem 0.75rem;
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

.tf-notif-panel__item-btn:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: -2px;
}

.tf-notif-panel__item--unread .tf-notif-panel__item-btn {
  background: rgba(0, 229, 255, 0.05);
}

.tf-notif-panel__dismiss {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--tf-on-surface-muted, #a8b0bc);
  cursor: pointer;
  padding: 0;
  z-index: 1;
}

.tf-notif-panel__dismiss:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--tf-on-surface, #e8ecf1);
}

.tf-notif-panel__dismiss:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 1px;
}

.tf-notif-panel__icon {
  flex-shrink: 0;
  width: 2.375rem;
  height: 2.375rem;
  border-radius: 11px;
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

.tf-notif-panel__icon--diet_updated {
  background: rgba(255, 167, 38, 0.14);
  color: #ffa726;
}

.tf-notif-panel__icon--pr_achieved {
  background: rgba(255, 213, 79, 0.14);
  color: #ffd54f;
}

.tf-notif-panel__icon--streak_milestone {
  background: rgba(255, 112, 67, 0.14);
  color: #ff7043;
}

.tf-notif-panel__icon--workout_reminder {
  background: rgba(0, 229, 255, 0.14);
  color: #00E5FF;
}

.tf-notif-panel__icon--membership_expiring,
.tf-notif-panel__icon--membership_expired,
.tf-notif-panel__icon--membership_grace {
  background: rgba(171, 71, 188, 0.16);
  color: #ce93d8;
}

.tf-notif-panel__icon--gym_membership_expiring,
.tf-notif-panel__icon--gym_membership_expired {
  background: rgba(0, 229, 255, 0.14);
  color: #00E5FF;
}

.tf-notif-panel__icon--streak_at_risk {
  background: rgba(239, 83, 80, 0.16);
  color: #ef5350;
}

.tf-notif-panel__action:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
}

.tf-notif-panel__body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  align-self: flex-start;
  gap: 0.2rem;
}

.tf-notif-panel__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: flex-start;
  gap: 0.15rem 0.65rem;
  margin: 0;
}

.tf-notif-panel__item-title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--tf-on-surface, #e8ecf1);
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.tf-notif-panel__time {
  flex: 0 0 auto;
  margin-left: auto;
  font-size: 0.6875rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
  line-height: 1.35;
}

.tf-notif-panel__message {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--tf-on-surface-muted, #a8b0bc);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.tf-notif-panel__unread-dot {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  margin-top: 0.4rem;
  border-radius: 50%;
  background: #00E5FF;
}

.tf-notif-detail-dialog {
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5) !important;
  max-width: calc(100vw - 1.5rem) !important;
}

.tf-notif-detail {
  padding: 1.5rem 1.25rem 1.1rem;
  background: #13161D;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  color: var(--tf-on-surface, #e8ecf1);
  box-sizing: border-box;
}

.tf-notif-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tf-notif-detail__icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-notif-detail__close {
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--tf-on-surface-muted, #a8b0bc);
  cursor: pointer;
  padding: 0;
}

.tf-notif-detail__close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--tf-on-surface, #e8ecf1);
}

.tf-notif-detail__close:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
}

.tf-notif-detail__title {
  margin: 0 0 0.4rem;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.01em;
  color: var(--tf-on-surface, #e8ecf1);
  overflow-wrap: anywhere;
}

.tf-notif-detail__time {
  margin: 0 0 0.85rem;
  font-size: 0.8125rem;
  color: var(--tf-on-surface-muted, #a8b0bc);
}

.tf-notif-detail__message {
  margin: 0 0 1.35rem;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--tf-on-surface, #e8ecf1);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.tf-notif-detail__actions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.tf-notif-detail__cta {
  min-height: 2.75rem;
  font-weight: 700;
}

.tf-notif-detail__secondary {
  min-height: 2.75rem;
  color: var(--tf-on-surface-muted, #a8b0bc) !important;
}

.tf-notif-detail__secondary:focus-visible {
  outline: 2px solid #00e5ff;
  outline-offset: 2px;
}
</style>
