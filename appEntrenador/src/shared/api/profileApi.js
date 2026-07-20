import http from './http.js';

export function getProfile(userId) {
  return http.get(`/profile/${userId}`);
}

/**
 * Upsert profile. Pass a plain object or FormData (with optional `foto` file).
 * @param {number} userId
 * @param {FormData|Record<string, string>} payload
 */
export function updateProfile(userId, payload) {
  return http.put(`/profile/${userId}`, payload);
}

/**
 * Build multipart body for profile save.
 * @param {object} fields
 * @param {File|null} [fotoFile]
 */
export function buildProfileFormData(fields, fotoFile = null) {
  const formData = new FormData();
  const keys = ['email', 'telefono', 'fecha_nacimiento', 'sexo', 'lesiones', 'objetivo'];
  for (const key of keys) {
    if (fields[key] == null) continue;
    formData.append(key, String(fields[key]));
  }
  if (fotoFile) {
    formData.append('foto', fotoFile);
  }
  return formData;
}
