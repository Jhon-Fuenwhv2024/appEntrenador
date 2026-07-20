import { API_ORIGIN } from '../api/http.js';
import { getAuthToken } from '../auth/session.js';

/**
 * Build absolute media URL. Private paths (/uploads/photos|avatars) need ?token=
 * because <img>/<video> cannot send Authorization headers.
 * @param {string|null|undefined} mediaPath
 * @returns {string}
 */
export function resolveMediaSrc(mediaPath) {
  const url = typeof mediaPath === 'string' ? mediaPath.trim() : '';
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const path = url.startsWith('/') ? url : `/${url}`;
  const absolute = `${API_ORIGIN}${path}`;
  return appendMediaAuthToken(absolute, path);
}

/**
 * @param {string} absoluteUrl
 * @param {string} [pathHint]
 * @returns {string}
 */
export function appendMediaAuthToken(absoluteUrl, pathHint = '') {
  const path = pathHint || absoluteUrl;
  const needsToken = path.includes('/uploads/photos') || path.includes('/uploads/avatars');
  if (!needsToken) return absoluteUrl;
  const token = getAuthToken();
  if (!token) return absoluteUrl;
  if (absoluteUrl.includes('token=')) return absoluteUrl;
  const sep = absoluteUrl.includes('?') ? '&' : '?';
  return `${absoluteUrl}${sep}token=${encodeURIComponent(token)}`;
}
