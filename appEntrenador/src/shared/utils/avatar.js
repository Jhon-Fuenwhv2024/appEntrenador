import defaultAvatar from '../../assets/foto_perfil.png';
import { resolveMediaSrc } from './mediaUrl.js';

/**
 * Resolve display URL for a profile photo.
 * Uses uploaded `/uploads/...` URL when present; otherwise default asset.
 * Avatars require auth token query (see mediaUrl.js).
 * @param {string|null|undefined} fotoUrl
 * @returns {string}
 */
export function resolveAvatarSrc(fotoUrl) {
  const url = typeof fotoUrl === 'string' ? fotoUrl.trim() : '';
  if (!url || url === 'default_avatar.png') {
    return defaultAvatar;
  }
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const resolved = resolveMediaSrc(url);
  return resolved || defaultAvatar;
}

export { defaultAvatar };
