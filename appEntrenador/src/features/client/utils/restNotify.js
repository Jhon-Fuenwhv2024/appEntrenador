/**
 * Local OS notification when rest ends while the app is hidden (Feature 086).
 * Reuses Notification permission (same as Web Push). Soft-fails if denied.
 * Feature 088: actionUrl always includes resume=1 so remount hydrates the draft.
 */

const REST_TAG = 'trainfit-rest-complete';

function isSafeActionUrl(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
}

/**
 * Keep path + query, force resume=1 for crash-recovery hydrate on remount.
 * @param {string} pathWithSearch
 */
export function withWorkoutResumeQuery(pathWithSearch) {
  if (!isSafeActionUrl(pathWithSearch)) return '/';
  try {
    const url = new URL(pathWithSearch, 'https://trainfit.local');
    url.searchParams.set('resume', '1');
    return `${url.pathname}${url.search}`;
  } catch {
    const base = pathWithSearch.split('#')[0];
    if (base.includes('resume=')) return base;
    return base.includes('?') ? `${base}&resume=1` : `${base}?resume=1`;
  }
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
  const rawAction = isSafeActionUrl(opts.actionUrl)
    ? opts.actionUrl
    : `${window.location.pathname}${window.location.search || ''}`;
  const actionUrl = withWorkoutResumeQuery(rawAction);

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
