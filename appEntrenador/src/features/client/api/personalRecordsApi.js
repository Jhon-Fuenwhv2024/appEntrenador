import http from '../../../shared/api/http.js';

export function getMyPersonalRecords() {
  return http.get('/me/personal-records');
}
