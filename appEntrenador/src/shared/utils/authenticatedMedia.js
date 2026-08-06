import { resolveApiBaseUrl, resolveApiOrigin } from '../../config/api.js';
import { getAuthToken } from '../auth/session.js';

const API_ORIGIN = resolveApiOrigin(resolveApiBaseUrl());

const DEFAULT_AVATAR_MARKERS = new Set(['', 'default_avatar.png', 'null', 'undefined']);

/** @type {Map<string, string>} path → blob: URL */
const blobCache = new Map();
/** @type {Map<string, Promise<string|null>>} */
const inflight = new Map();

/**
 * @param {string|null|undefined} fotoUrl
 * @returns {boolean}
 */
export function isCustomFotoUrl(fotoUrl) {
  const url = typeof fotoUrl === 'string' ? fotoUrl.trim() : '';
  return Boolean(url) && !DEFAULT_AVATAR_MARKERS.has(url);
}

/**
 * @param {string} mediaPath
 * @returns {{ path: string, absolute: string }|null}
 */
function resolvePrivateMediaTarget(mediaPath) {
  const raw = typeof mediaPath === 'string' ? mediaPath.trim() : '';
  if (!raw || DEFAULT_AVATAR_MARKERS.has(raw)) return null;
  if (raw.startsWith('blob:') || raw.startsWith('data:')) {
    return { path: raw, absolute: raw };
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      parsed.searchParams.delete('token');
      const path = parsed.pathname || '';
      if (!path.includes('/uploads/photos') && !path.includes('/uploads/avatars')) {
        return { path: raw, absolute: raw };
      }
      return { path, absolute: parsed.toString() };
    } catch {
      return { path: raw, absolute: raw };
    }
  }

  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return { path, absolute: `${API_ORIGIN}${path}` };
}

function isPrivateUploadPath(path) {
  return path.includes('/uploads/photos') || path.includes('/uploads/avatars');
}

/**
 * Drop cached blob for a media path (e.g. after avatar re-upload).
 * @param {string|null|undefined} mediaPath
 */
export function invalidateAuthenticatedMedia(mediaPath) {
  const target = resolvePrivateMediaTarget(mediaPath);
  if (!target || target.path.startsWith('blob:') || target.path.startsWith('data:')) return;
  const cached = blobCache.get(target.path);
  if (cached) {
    try {
      URL.revokeObjectURL(cached);
    } catch {
      /* ignore */
    }
    blobCache.delete(target.path);
  }
  inflight.delete(target.path);
}

/** Revoke all cached avatar/photo blobs (call on logout). */
export function clearAuthenticatedMediaCache() {
  for (const url of blobCache.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
  blobCache.clear();
  inflight.clear();
}

/**
 * Fetch private media with Bearer auth (refresh once on 401) and return a blob URL.
 * Public / blob / data URLs are returned as-is.
 * @param {string|null|undefined} mediaPath
 * @param {{ bust?: boolean }} [options]
 * @returns {Promise<string|null>}
 */
export async function fetchAuthenticatedMediaBlobUrl(mediaPath, options = {}) {
  const target = resolvePrivateMediaTarget(mediaPath);
  if (!target) return null;

  if (target.path.startsWith('blob:') || target.path.startsWith('data:')) {
    return target.absolute;
  }

  if (!isPrivateUploadPath(target.path)) {
    return target.absolute;
  }

  if (options.bust) {
    invalidateAuthenticatedMedia(target.path);
  }

  if (blobCache.has(target.path)) {
    return blobCache.get(target.path);
  }

  if (inflight.has(target.path)) {
    return inflight.get(target.path);
  }

  const promise = (async () => {
    const doFetch = async (token) => {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return fetch(target.absolute, {
        method: 'GET',
        headers,
        credentials: 'omit',
        cache: 'no-store',
      });
    };

    let response = await doFetch(getAuthToken());
    if (response.status === 401) {
      try {
        const { refreshSessionTokens } = await import('../api/http.js');
        const { token } = await refreshSessionTokens();
        response = await doFetch(token);
      } catch (error) {
        console.error('[media] refresh failed for private upload:', error);
        throw error;
      }
    }

    if (!response.ok) {
      throw new Error(`Private media HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const type = (blob.type || '').toLowerCase();
    if (type.includes('json') || type.includes('text/')) {
      throw new Error('Private media response was not an image');
    }

    const objectUrl = URL.createObjectURL(blob);
    const previous = blobCache.get(target.path);
    if (previous && previous !== objectUrl) {
      try {
        URL.revokeObjectURL(previous);
      } catch {
        /* ignore */
      }
    }
    blobCache.set(target.path, objectUrl);
    return objectUrl;
  })();

  inflight.set(target.path, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(target.path);
  }
}
