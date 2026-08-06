import defaultAvatar from '../../assets/foto_perfil.png';
import { resolveMediaSrc } from './mediaUrl.js';

/**
 * Resolve display URL for a profile photo (legacy sync helper).
 * Prefer `useAuthenticatedAvatar` / `TfAvatar` for private `/uploads/avatars`
 * so the short-lived access JWT is not embedded in `<img src>?token=`.
 * Uses uploaded `/uploads/...` URL when present; otherwise default asset.
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
