import axios from 'axios';
import { resolveApiBaseUrl, resolveApiOrigin } from '../../config/api.js';
import {
  clearSession,
  getAuthToken,
  getRefreshToken,
  setSession,
} from '../auth/session.js';
import { clearSessionAccountCache } from '../composables/useSessionAccount.js';
import { clearPushUserId } from '../push/pushUserStore.js';

const API_BASE_URL = resolveApiBaseUrl();

/** Origin without `/api` — used for static uploads (`/uploads/...`). */
export const API_ORIGIN = resolveApiOrigin(API_BASE_URL);

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Paths that must not trigger session wipe / refresh loop on 401. */
const AUTH_PUBLIC_PATHS = [
  '/login',
  '/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
];

/**
 * Soft endpoints: may 401 when access expired while switching tabs/apps.
 * Still attempt refresh, but never wipe the session if refresh fails.
 */
const SOFT_AUTH_PATHS = [
  '/push/presence',
];

function normalizeRequestPath(url = '') {
  const path = String(url).split('?')[0];
  if (path.startsWith('http')) {
    try {
      return new URL(path).pathname.replace(/\/api$/, '').replace(/^\/api/, '') || path;
    } catch {
      return path;
    }
  }
  return path.startsWith('/') ? path : `/${path}`;
}

function isAuthPublicRequest(config) {
  const path = normalizeRequestPath(config?.url || '');
  return AUTH_PUBLIC_PATHS.some((p) => path === p || path.endsWith(p));
}

function isSoftAuthRequest(config) {
  if (config?.softAuth) return true;
  const path = normalizeRequestPath(config?.url || '');
  return SOFT_AUTH_PATHS.some((p) => path === p || path.endsWith(p));
}

let refreshPromise = null;

async function runExclusiveRefresh(task) {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    try {
      return await navigator.locks.request('trainfit-auth-refresh', task);
    } catch (error) {
      // Locks can fail in private mode / unsupported contexts — fall through.
      console.warn('[auth] locks unavailable:', error?.message || error);
    }
  }
  return task();
}

/**
 * Single-flight refresh (same tab + Web Locks across tabs when available).
 */
export function refreshSessionTokens() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = runExclusiveRefresh(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );

    const { success, user, token, refreshToken: nextRefresh } = response.data || {};
    if (!success || !token || !nextRefresh) {
      throw new Error('Refresh incompleto');
    }

    setSession({ user, token, refreshToken: nextRefresh });
    return { token, refreshToken: nextRefresh, user };
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function forceLogoutRedirect() {
  clearSessionAccountCache();
  clearSession();
  clearPushUserId().catch(() => {});
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/registro')) {
    const onLogin = window.location.pathname === '/' || window.location.pathname === '';
    if (!onLogin) {
      window.location.assign('/');
    }
  }
}

http.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const message = responseData?.error
      || responseData?.message
      || error.message
      || 'Error de conexión con el servidor.';
    const original = error.config;
    const softAuth = isSoftAuthRequest(original);

    if (status === 401 && original && !isAuthPublicRequest(original)) {
      if (!original._retry && getRefreshToken()) {
        original._retry = true;
        try {
          const { token } = await refreshSessionTokens();
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${token}`;
          return http(original);
        } catch (refreshError) {
          if (!softAuth) {
            forceLogoutRedirect();
          }
          error.normalized = {
            success: false,
            error: softAuth
              ? message
              : 'Sesión expirada. Vuelve a iniciar sesión.',
            message: softAuth
              ? message
              : 'Sesión expirada. Vuelve a iniciar sesión.',
            code: 401,
            details: refreshError?.response?.data,
          };
          return Promise.reject(error);
        }
      }

      if (!softAuth) {
        forceLogoutRedirect();
      }
    }

    error.normalized = {
      success: false,
      error: message,
      message,
      code: responseData?.code || status || 0,
      details: responseData,
    };

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error, fallback = 'Error de conexión con el servidor.') {
  return error?.response?.data?.message
    || error?.normalized?.message
    || error?.normalized?.error
    || error?.response?.data?.error
    || fallback;
}

/** True si el backend respondió 402 (límite FREE / paywall SaaS / asiento bloqueado). */
export function isPaymentRequiredError(error) {
  return Number(error?.response?.status || error?.normalized?.code) === 402;
}

/** True si el alumno está fuera del cupo FREE editable (Feature 065 opción B). */
export function isSeatLockedError(error) {
  const code = error?.response?.data?.code
    || error?.response?.data?.error
    || error?.normalized?.code;
  return code === 'SEAT_LOCKED'
    || (
      isPaymentRequiredError(error)
      && String(error?.response?.data?.message || '').toLowerCase().includes('3 primeros')
    );
}

/** True si el alumno está soft-locked por membresía (Feature 040). */
export function isMembershipBlockedError(error) {
  const code = error?.response?.data?.code
    || error?.response?.data?.error
    || error?.normalized?.code;
  return code === 'MEMBERSHIP_BLOCKED';
}

export default http;
