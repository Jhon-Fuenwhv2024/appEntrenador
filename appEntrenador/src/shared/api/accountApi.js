import http from './http.js';

export function getMyAccount() {
  return http.get('/me/account');
}

/**
 * @param {FormData|Record<string, string>} payload
 */
export function updateMyAccount(payload) {
  return http.put('/me/account', payload);
}

export function changeMyPassword({ current_password, new_password }) {
  return http.post('/me/password', { current_password, new_password });
}

/**
 * @param {{ nombre?: string, telefono?: string, email?: string }} fields
 * @param {File|null} [fotoFile]
 */
export function buildAccountFormData(fields, fotoFile = null) {
  const formData = new FormData();
  if (fields.nombre != null) formData.append('nombre', String(fields.nombre));
  if (fields.telefono != null) formData.append('telefono', String(fields.telefono));
  if (fields.email != null) formData.append('email', String(fields.email));
  if (fotoFile) formData.append('foto', fotoFile);
  return formData;
}
