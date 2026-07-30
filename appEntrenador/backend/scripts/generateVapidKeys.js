/**
 * One-shot: generate VAPID keys for Web Push (Feature 051).
 * Usage: node scripts/generateVapidKeys.js
 * Copy the printed values into backend/.env (never commit private key).
 */
const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();

console.log('# Add to backend/.env (Feature 051 — Web Push)');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:noreply@tudominio.com');
