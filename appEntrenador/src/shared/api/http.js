import axios from 'axios';
import { clearSession, getAuthToken } from '../auth/session.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/** Origin without `/api` — used for public avatar uploads (`/uploads/avatars/...`). */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  (error) => {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const message = responseData?.error
      || responseData?.message
      || error.message
      || 'Error de conexión con el servidor.';

    if (status === 401) {
      clearSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/registro')) {
        const onLogin = window.location.pathname === '/' || window.location.pathname === '';
        if (!onLogin) {
          window.location.assign('/');
        }
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
  return error?.normalized?.error
    || error?.response?.data?.error
    || error?.response?.data?.message
    || fallback;
}

export default http;
