import { computed, ref } from 'vue';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../shared/api/notificationsApi.js';

const notifications = ref([]);
const unreadCount = ref(0);
const isLoading = ref(false);

export function useNotifications() {
  const fetchNotifications = async () => {
    isLoading.value = true;
    try {
      const response = await getNotifications();
      if (response.data?.success) {
        notifications.value = response.data.data.notifications || [];
        unreadCount.value = Number(response.data.data.unreadCount) || 0;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const markAsRead = async (id) => {
    try {
      const response = await markNotificationAsRead(id);
      if (response.data?.success) {
        const notif = notifications.value.find((n) => n.id === id);
        if (notif && !notif.is_read) {
          notif.is_read = true;
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await markAllNotificationsAsRead();
      if (response.data?.success) {
        notifications.value.forEach((n) => {
          n.is_read = true;
        });
        unreadCount.value = 0;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications: computed(() => notifications.value),
    unreadCount: computed(() => unreadCount.value),
    isLoading: computed(() => isLoading.value),
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
