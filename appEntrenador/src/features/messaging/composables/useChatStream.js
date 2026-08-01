import { onUnmounted, shallowRef, toValue, watch } from 'vue';
import { getMessagesStreamUrl } from '../api/messagesApi.js';

/**
 * Opens an EventSource to /api/messages/stream and cleans up on unmount.
 * Pauses the stream while the document is hidden so backgrounded / closed PWAs
 * do not leave a zombie SSE that blocks chat push on the server.
 * @param {(message: object) => void} onMessage
 * @param {{ enabled?: import('vue').MaybeRefOrGetter<boolean> }} [options]
 */
export function useChatStream(onMessage, options = {}) {
  const connected = shallowRef(false);
  const error = shallowRef('');
  let eventSource = null;
  let wantOpen = false;
  let visibilityBound = false;

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

  const syncWithVisibility = () => {
    if (!wantOpen) {
      close();
      return;
    }
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      close();
      return;
    }
    open();
  };

  const onVisibilityChange = () => {
    syncWithVisibility();
  };

  const bindVisibility = () => {
    if (visibilityBound || typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', onVisibilityChange);
    visibilityBound = true;
  };

  const unbindVisibility = () => {
    if (!visibilityBound || typeof document === 'undefined') return;
    document.removeEventListener('visibilitychange', onVisibilityChange);
    visibilityBound = false;
  };

  const enabled = options.enabled;

  if (enabled !== undefined) {
    watch(
      () => toValue(enabled),
      (isEnabled) => {
        wantOpen = Boolean(isEnabled);
        if (wantOpen) {
          bindVisibility();
          syncWithVisibility();
        } else {
          close();
          unbindVisibility();
        }
      },
      { immediate: true },
    );
  }

  onUnmounted(() => {
    wantOpen = false;
    close();
    unbindVisibility();
  });

  return {
    connected,
    error,
    open,
    close,
  };
}
