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

/** Heartbeat: app visible / foreground (suppress chat push while active). */
export function touchPushPresence() {
  return http.post('/push/presence');
}

export function clearPushPresence() {
  return http.delete('/push/presence');
}
