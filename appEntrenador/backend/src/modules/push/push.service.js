const webpush = require('web-push');
const db = require('../../config/db');
const { VAPID, isVapidConfigured } = require('../../config/env');

let vapidReady = false;

function ensureVapidConfigured() {
  if (!isVapidConfigured) return false;
  if (!vapidReady) {
    webpush.setVapidDetails(VAPID.subject, VAPID.publicKey, VAPID.privateKey);
    vapidReady = true;
  }
  return true;
}

function isSafeActionUrl(url) {
  if (url == null || url === '') return true;
  if (typeof url !== 'string') return false;
  return url.startsWith('/') && !url.startsWith('//');
}

function sanitizeActionUrl(url) {
  if (!isSafeActionUrl(url)) return null;
  return url || null;
}

function mapSubscriptionRow(row) {
  return {
    id: Number(row.id),
    user_id: Number(row.user_id),
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    user_agent: row.user_agent ?? null,
  };
}

const pushService = {
  isEnabled() {
    return isVapidConfigured;
  },

  getPublicKey() {
    if (!isVapidConfigured) return null;
    return VAPID.publicKey;
  },

  /**
   * Upsert subscription for the authenticated user.
   * If the endpoint already belongs to another user, reassign to current user.
   */
  async upsertSubscription(userId, { endpoint, keys, userAgent = null }) {
    const ep = typeof endpoint === 'string' ? endpoint.trim() : '';
    const p256dh = typeof keys?.p256dh === 'string' ? keys.p256dh.trim() : '';
    const auth = typeof keys?.auth === 'string' ? keys.auth.trim() : '';

    if (!ep || ep.length > 2048) {
      const err = new Error('Endpoint de suscripción inválido.');
      err.status = 400;
      throw err;
    }
    if (!p256dh || !auth || p256dh.length > 255 || auth.length > 255) {
      const err = new Error('Claves de suscripción inválidas.');
      err.status = 400;
      throw err;
    }

    const ua =
      typeof userAgent === 'string' && userAgent.trim()
        ? userAgent.trim().slice(0, 512)
        : null;

    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         p256dh = VALUES(p256dh),
         auth = VALUES(auth),
         user_agent = VALUES(user_agent),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, ep, p256dh, auth, ua],
    );

    return { endpoint: ep };
  },

  async deleteSubscription(userId, endpoint) {
    const ep = typeof endpoint === 'string' ? endpoint.trim() : '';
    if (!ep) {
      const err = new Error('Endpoint requerido.');
      err.status = 400;
      throw err;
    }

    const [result] = await db.query(
      `DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`,
      [userId, ep],
    );
    return result.affectedRows > 0;
  },

  async listByUser(userId) {
    const id = Number(userId);
    if (!Number.isInteger(id) || id < 1) {
      return [];
    }
    const [rows] = await db.query(
      `SELECT id, user_id, endpoint, p256dh, auth, user_agent
       FROM push_subscriptions
       WHERE user_id = ?`,
      [id],
    );
    return rows.map(mapSubscriptionRow);
  },

  async deleteByEndpoint(endpoint) {
    await db.query(`DELETE FROM push_subscriptions WHERE endpoint = ?`, [endpoint]);
  },

  /**
   * Send Web Push to all devices of a user. Never throws to callers for delivery failures.
   * @returns {{ sent: number, removed: number, skipped: boolean }}
   */
  async sendPushToUser(userId, { title, body, actionUrl = null, type = 'system' } = {}) {
    if (!ensureVapidConfigured()) {
      return { sent: 0, removed: 0, skipped: true };
    }

    const id = Number(userId);
    if (!Number.isInteger(id) || id < 1) {
      console.warn('[push] sendPushToUser: userId inválido', userId);
      return { sent: 0, removed: 0, skipped: true };
    }

    const safeTitle = String(title || 'Trainfit').slice(0, 100);
    const safeBody = String(body || '').slice(0, 500);
    const safeUrl = sanitizeActionUrl(actionUrl);
    const safeType = String(type || 'system').slice(0, 50);

    const subscriptions = await this.listByUser(id);
    if (!subscriptions.length) {
      return { sent: 0, removed: 0, skipped: false };
    }

    const payload = JSON.stringify({
      title: safeTitle,
      body: safeBody,
      actionUrl: safeUrl,
      type: safeType,
      userId: id,
    });

    let sent = 0;
    let removed = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        // Defense: never deliver a row that belongs to another user.
        if (Number(sub.user_id) !== id) {
          console.warn('[push] skipping mismatched subscription row', sub.id);
          return;
        }
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
            { TTL: 60 * 60 * 12 },
          );
          sent += 1;
        } catch (error) {
          const statusCode = error.statusCode || error.status;
          if (statusCode === 404 || statusCode === 410) {
            await this.deleteByEndpoint(sub.endpoint);
            removed += 1;
            return;
          }
          console.warn('[push] send failed:', statusCode || error.message);
        }
      }),
    );

    return { sent, removed, skipped: false };
  },

  /**
   * Fire-and-forget wrapper used by notification / chat emitters.
   */
  notifyUserAsync(userId, payload) {
    const id = Number(userId);
    Promise.resolve()
      .then(() => this.sendPushToUser(id, payload))
      .catch((error) => {
        console.warn('[push] notifyUserAsync:', error.message);
      });
  },
};

module.exports = { pushService, isSafeActionUrl };
