import { API_ORIGIN } from '../api/http.js';
import defaultAvatar from '../../assets/foto_perfil.png';

/**
 * Resolve display URL for a profile photo.
 * Uses uploaded `/uploads/...` URL when present; otherwise default asset.
 * @param {string|null|undefined} fotoUrl
 * @returns {string}
 */
export function resolveAvatarSrc(fotoUrl) {
  const url = typeof fotoUrl === 'string' ? fotoUrl.trim() : '';
  if (!url || url === 'default_avatar.png') {
    return defaultAvatar;
  }
  if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_ORIGIN}${path}`;
}

export { defaultAvatar };
