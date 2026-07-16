import { onUnmounted, shallowRef, toValue, watch } from 'vue';
import { getMessagesStreamUrl } from '../api/messagesApi.js';

/**
 * Opens an EventSource to /api/messages/stream and cleans up on unmount.
 * @param {(message: object) => void} onMessage
 * @param {{ enabled?: import('vue').MaybeRefOrGetter<boolean> }} [options]
 */
export function useChatStream(onMessage, options = {}) {
  const connected = shallowRef(false);
  const error = shallowRef('');
  let eventSource = null;

  const close = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    connected.value = false;
  };

  const open = () => {
    close();
    error.value = '';

    const url = getMessagesStreamUrl();
    if (!url.includes('token=')) {
      error.value = 'Sin token de sesión para el stream.';
      return;
    }

    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      connected.value = true;
      error.value = '';
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onMessage(payload);
      } catch (parseError) {
        console.error('SSE message parse error:', parseError);
      }
    };

    eventSource.onerror = () => {
      connected.value = false;
      // Browser will retry; surface a soft status for UI if needed.
      error.value = 'Reconectando chat en tiempo real…';
    };
  };

  const enabled = options.enabled;

  if (enabled !== undefined) {
    watch(
      () => toValue(enabled),
      (isEnabled) => {
        if (isEnabled) open();
        else close();
      },
      { immediate: true },
    );
  }

  onUnmounted(() => {
    close();
  });

  return {
    connected,
    error,
    open,
    close,
  };
}
