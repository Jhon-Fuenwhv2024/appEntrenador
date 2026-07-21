/**
 * Resolución automática de la URL del backend.
 *
 * - Navegador en localhost → API local
 * - Frontend desplegado → VITE_API_URL (build) o API de producción por defecto
 * - Nunca usa localhost cuando el front ya está en un host público
 */

export const LOCAL_API_URL = 'http://localhost:3000/api';

/** Fallback si el build no inyecta VITE_API_URL (Render). */
export const DEFAULT_PRODUCTION_API_URL = 'https://appentrenador.onrender.com/api';

/**
 * @param {string} [hostname]
 * @returns {boolean}
 */
export function isLocalHostname(hostname) {
  const host = String(hostname || '').toLowerCase();
  return (
    host === 'localhost'
    || host === '127.0.0.1'
    || host === '[::1]'
    || host === '0.0.0.0'
    || host.endsWith('.localhost')
  );
}

/**
 * @returns {boolean}
 */
export function isLocalFrontend() {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return isLocalHostname(window.location.hostname);
  }
  // SSR / tests / build: modo Vite
  return Boolean(import.meta.env.DEV);
}

/**
 * @param {string} url
 * @returns {boolean}
 */
function isLocalApiUrl(url) {
  try {
    const { hostname } = new URL(url);
    return isLocalHostname(hostname);
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/**
 * URL base del API (incluye `/api`).
 * @returns {string}
 */
export function resolveApiBaseUrl() {
  const fromEnv = String(import.meta.env.VITE_API_URL || '').trim();

  if (isLocalFrontend()) {
    // En local siempre apuntamos al backend local, aunque el build
    // haya embebido la URL de producción (p. ej. `vite preview`).
    return LOCAL_API_URL;
  }

  // En despliegue: nunca caer a localhost (rompe login/API en el navegador del usuario).
  if (fromEnv && !isLocalApiUrl(fromEnv)) {
    return fromEnv.replace(/\/$/, '');
  }

  return DEFAULT_PRODUCTION_API_URL;
}

/**
 * Origin del backend sin `/api` (uploads, media, etc.).
 * @param {string} [apiBaseUrl]
 * @returns {string}
 */
export function resolveApiOrigin(apiBaseUrl = resolveApiBaseUrl()) {
  return apiBaseUrl.replace(/\/api\/?$/, '');
}
