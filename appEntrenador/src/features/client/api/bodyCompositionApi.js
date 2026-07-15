import http from '../../../shared/api/http.js';

export function getMyBodyComposition() {
  return http.get('/me/body-composition');
}
