import http from '../../../shared/api/http.js';

export function getMyConsistency() {
  return http.get('/me/consistency');
}
