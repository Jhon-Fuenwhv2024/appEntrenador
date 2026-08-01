import http from '../../../shared/api/http.js';

export function listMembershipTypes(includeInactive = false) {
  return http.get('/trainer/membership-types', {
    params: includeInactive ? { include_inactive: '1' } : undefined,
  });
}

export function createMembershipType(payload) {
  return http.post('/trainer/membership-types', payload);
}

export function updateMembershipType(id, payload) {
  return http.put(`/trainer/membership-types/${id}`, payload);
}

export function deleteMembershipType(id) {
  return http.delete(`/trainer/membership-types/${id}`);
}
