import http from './http.js';

export function getVapidPublicKey() {
  return http.get('/push/vapid-public-key');
}

export function savePushSubscription(subscriptionPayload) {
  return http.post('/push/subscriptions', subscriptionPayload);
}

export function deletePushSubscription(endpoint) {
  return http.delete('/push/subscriptions', { data: { endpoint } });
}
