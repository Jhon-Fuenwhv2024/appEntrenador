import { API_ORIGIN } from '../api/http.js';

/**
 * Prefer Spanish catalog label when Feature 044 fields exist.
 * @param {{ name?: string, name_es?: string|null }} exercise
 * @returns {string}
 */
export function displayExerciseName(exercise) {
  const es = typeof exercise?.name_es === 'string' ? exercise.name_es.trim() : '';
  if (es) return es;
  return typeof exercise?.name === 'string' ? exercise.name : '';
}

/**
 * @param {{ description?: string|null, description_es?: string|null }} exercise
 * @returns {string}
 */
export function displayExerciseDescription(exercise) {
  const es = typeof exercise?.description_es === 'string'
    ? exercise.description_es.trim()
    : '';
  if (es) return es;
  return typeof exercise?.description === 'string' ? exercise.description : '';
}

/**
 * @param {{ target_muscle?: string, target_muscle_es?: string|null }} exercise
 * @returns {string}
 */
export function displayExerciseMuscle(exercise) {
  const es = typeof exercise?.target_muscle_es === 'string'
    ? exercise.target_muscle_es.trim()
    : '';
  if (es) return es;
  return typeof exercise?.target_muscle === 'string' ? exercise.target_muscle : '';
}

/**
 * Resolve playable media URL: local_media_path (API origin) > absolute media_url.
 * @param {{ local_media_path?: string|null, media_url?: string|null }} exercise
 * @returns {string|null}
 */
export function resolveExerciseMediaSrc(exercise) {
  const local = typeof exercise?.local_media_path === 'string'
    ? exercise.local_media_path.trim()
    : '';
  if (local) {
    if (/^https?:\/\//i.test(local)) return local;
    const path = local.startsWith('/') ? local : `/${local}`;
    return `${API_ORIGIN}${path}`;
  }

  const url = typeof exercise?.media_url === 'string' ? exercise.media_url.trim() : '';
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_ORIGIN}${path}`;
}

/**
 * @param {string|null|undefined} src
 * @param {string|null|undefined} mediaType
 * @returns {'video'|'gif'|'image'|'youtube'|'none'}
 */
export function getExerciseMediaKind(src, mediaType) {
  const type = (mediaType || '').toLowerCase();
  if (type === 'youtube') return 'youtube';
  if (!src) return 'none';

  const lower = src.toLowerCase().split('?')[0];
  if (lower.endsWith('.mp4') || lower.endsWith('.webm') || type === 'video') {
    return 'video';
  }
  if (lower.endsWith('.gif') || type === 'gif') return 'gif';
  if (type === 'image' || /\.(jpe?g|png|webp)$/.test(lower)) return 'image';
  if (type === 'none') return 'none';
  return 'image';
}
