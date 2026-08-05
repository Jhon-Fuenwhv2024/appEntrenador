/**
 * Local OS notification when rest ends while the app is hidden (Feature 086).
 * Reuses Notification permission (same as Web Push). Soft-fails if denied.
 */

const REST_TAG = 'trainfit-rest-complete';

function isSafeActionUrl(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
}

/**
 * @param {{ title?: string, body?: string, actionUrl?: string }} [opts]
 */
export async function notifyRestComplete(opts = {}) {
  if (typeof window === 'undefined') return false;
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;

  // Only useful when the page is not visible (user minimized / switched apps).
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    return false;
  }

  const title = opts.title || 'Descanso terminado';
  const body = opts.body || 'Toca para volver al entrenamiento';
  const actionUrl = isSafeActionUrl(opts.actionUrl)
    ? opts.actionUrl
    : (typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search || ''}`
      : '/');

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-badge-96.png',
        tag: REST_TAG,
        renotify: true,
        data: {
          actionUrl,
          type: 'rest_complete',
        },
      });
      return true;
    }

    // Fallback without SW
    // eslint-disable-next-line no-new
    new Notification(title, {
      body,
      tag: REST_TAG,
      data: { actionUrl, type: 'rest_complete' },
    });
    return true;
  } catch (error) {
    console.warn('[restNotify] failed:', error?.message || error);
    return false;
  }
}
