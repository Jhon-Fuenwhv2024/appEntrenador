/**
 * Web Push + PWA registration (Feature 051).
 */
import { computed, readonly, shallowRef } from 'vue';
import {
  deletePushSubscription,
  getVapidPublicKey,
  savePushSubscription,
} from '../api/pushApi.js';
import { getApiErrorMessage } from '../api/http.js';

const PROMPT_DISMISS_KEY = 'tf_push_prompt_dismissed';

const permission = shallowRef(
  typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
);
const enabledOnServer = shallowRef(false);
const subscribed = shallowRef(false);
const busy = shallowRef(false);
const lastError = shallowRef('');
const registration = shallowRef(null);

let registerPromise = null;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function subscriptionToPayload(subscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    },
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  };
}

function isPushSupported() {
  return (
    typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && typeof Notification !== 'undefined'
  );
}

async function ensureServiceWorker() {
  if (!isPushSupported()) return null;
  if (registration.value) return registration.value;
  if (!registerPromise) {
    registerPromise = (async () => {
      const { registerSW } = await import('virtual:pwa-register');
      registerSW({ immediate: true });
      const reg = await navigator.serviceWorker.ready;
      registration.value = reg;
      return reg;
    })().catch((error) => {
      registerPromise = null;
      throw error;
    });
  }
  return registerPromise;
}

async function refreshSubscriptionState() {
  if (!isPushSupported()) {
    subscribed.value = false;
    permission.value = 'unsupported';
    return;
  }
  permission.value = Notification.permission;
  try {
    const reg = await ensureServiceWorker();
    const sub = await reg?.pushManager?.getSubscription();
    subscribed.value = Boolean(sub);
  } catch {
    subscribed.value = false;
  }
}

async function checkServerEnabled() {
  try {
    const res = await getVapidPublicKey();
    enabledOnServer.value = Boolean(res.data?.data?.publicKey);
    return res.data?.data?.publicKey || null;
  } catch (error) {
    enabledOnServer.value = false;
    if (error.response?.status !== 503) {
      lastError.value = getApiErrorMessage(error, 'Push no disponible');
    }
    return null;
  }
}

async function enablePush() {
  if (!isPushSupported()) {
    lastError.value = 'Este navegador no soporta notificaciones push.';
    return false;
  }

  busy.value = true;
  lastError.value = '';
  try {
    const publicKey = await checkServerEnabled();
    if (!publicKey) {
      lastError.value = 'El servidor no tiene push configurado (VAPID).';
      return false;
    }

    const reg = await ensureServiceWorker();
    if (!reg) {
      lastError.value = 'No se pudo registrar el service worker.';
      return false;
    }

    const result = await Notification.requestPermission();
    permission.value = result;
    if (result !== 'granted') {
      lastError.value = 'Permiso de notificaciones denegado.';
      subscribed.value = false;
      return false;
    }

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    await savePushSubscription(subscriptionToPayload(sub));
    subscribed.value = true;
    localStorage.setItem(PROMPT_DISMISS_KEY, '1');
    return true;
  } catch (error) {
    console.error('[push] enablePush:', error);
    lastError.value = getApiErrorMessage(error, 'No se pudo activar push');
    subscribed.value = false;
    return false;
  } finally {
    busy.value = false;
  }
}

async function disablePush() {
  if (!isPushSupported()) return true;

  busy.value = true;
  lastError.value = '';
  try {
    const reg = await ensureServiceWorker();
    const sub = await reg?.pushManager?.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      try {
        await deletePushSubscription(endpoint);
      } catch (error) {
        // Still unsubscribe locally even if API fails (e.g. already deleted).
        console.warn('[push] delete subscription API:', error);
      }
      await sub.unsubscribe();
    }
    subscribed.value = false;
    return true;
  } catch (error) {
    console.error('[push] disablePush:', error);
    lastError.value = getApiErrorMessage(error, 'No se pudo desactivar push');
    return false;
  } finally {
    busy.value = false;
  }
}

function isPromptDismissed() {
  try {
    return localStorage.getItem(PROMPT_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function dismissPrompt() {
  try {
    localStorage.setItem(PROMPT_DISMISS_KEY, '1');
  } catch {
    // ignore
  }
}

/**
 * Shared module state — call from AppShell soft-prompt and settings toggle.
 */
export function usePushNotifications() {
  const supported = computed(() => isPushSupported());
  const canPrompt = computed(
    () =>
      supported.value
      && permission.value === 'default'
      && !subscribed.value
      && !isPromptDismissed(),
  );

  return {
    supported,
    permission: readonly(permission),
    enabledOnServer: readonly(enabledOnServer),
    subscribed: readonly(subscribed),
    busy: readonly(busy),
    lastError: readonly(lastError),
    canPrompt,
    ensureServiceWorker,
    refreshSubscriptionState,
    checkServerEnabled,
    enablePush,
    disablePush,
    dismissPrompt,
    isPromptDismissed,
  };
}
