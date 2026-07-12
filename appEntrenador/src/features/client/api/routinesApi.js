import http from '../../../shared/api/http.js';

export function getMyRoutines() {
  return http.get('/me/routines');
}
