/**
 * Shared unread DM summary (Feature 073).
 * Module-level state so AppBottomNav, inbox and chat thread stay in sync.
 * Poll every 45s + refresh on visibilitychange.
 */
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { getUnreadSummary } from '../api/messagesApi.js';

const POLL_MS = 45_000;

const total = shallowRef(0);
const byPartner = ref([]);
const isLoading = shallowRef(false);
const lastError = shallowRef('');

let pollTimer = null;
let visibilityBound = false;
let subscriberCount = 0;

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refresh();
  }
}

function startPolling() {
  if (pollTimer != null) return;
  pollTimer = setInterval(() => {
    refresh();
  }, POLL_MS);

  if (!visibilityBound && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
    visibilityBound = true;
  }
}

function stopPolling() {
  if (pollTimer != null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (visibilityBound && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    visibilityBound = false;
  }
}

async function refresh() {
  isLoading.value = true;
  lastError.value = '';

  try {
    const response = await getUnreadSummary();
    const data = response.data?.data;
    total.value = Number(data?.total) || 0;
    byPartner.value = Array.isArray(data?.byPartner) ? data.byPartner : [];
  } catch (error) {
    console.error('Error fetching unread messages summary:', error);
    lastError.value = error?.message || 'Error al cargar no leídos';
  } finally {
    isLoading.value = false;
  }
}

/**
 * @param {{ autoStart?: boolean }} [options]
 * autoStart (default true): mount starts poll + initial fetch; unmount stops when last subscriber leaves.
 */
export function useUnreadMessages(options = {}) {
  const autoStart = options.autoStart !== false;

  if (autoStart) {
    onMounted(() => {
      subscriberCount += 1;
      refresh();
      startPolling();
    });

    onUnmounted(() => {
      subscriberCount = Math.max(0, subscriberCount - 1);
      if (subscriberCount === 0) {
        stopPolling();
      }
    });
  }

  const badgeLabel = computed(() => {
    const count = Number(total.value) || 0;
    if (count <= 0) return '';
    if (count > 99) return '99+';
    return String(count);
  });

  const unreadByPartnerId = computed(() => {
    const map = new Map();
    for (const item of byPartner.value) {
      map.set(Number(item.partnerId), item);
    }
    return map;
  });

  return {
    total: computed(() => total.value),
    byPartner: computed(() => byPartner.value),
    unreadByPartnerId,
    isLoading: computed(() => isLoading.value),
    lastError: computed(() => lastError.value),
    badgeLabel,
    refresh,
  };
}
