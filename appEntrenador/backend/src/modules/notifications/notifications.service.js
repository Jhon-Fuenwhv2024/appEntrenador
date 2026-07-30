const db = require('../../config/db');

const TTL_DAYS = 30;
const READ_RETENTION_DAYS = 3;

function defaultExpiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + TTL_DAYS);
  return d;
}

function mapNotificationRow(row) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    entity_type: row.entity_type ?? null,
    entity_id: row.entity_id != null ? Number(row.entity_id) : null,
    action_url: row.action_url ?? null,
    is_read: Boolean(row.is_read),
    created_at: row.created_at,
    expires_at: row.expires_at ?? null,
  };
}

function getPushService() {
  // Lazy require avoids circular init issues if push ever imports notifications.
  return require('../push/push.service').pushService;
}

const notificationService = {
  /**
   * Hard-delete expired rows and old read notifications for one user.
   * Scoped to user_id (never global purge).
   */
  async purgeForUser(userId) {
    await db.query(
      `DELETE FROM notifications
       WHERE user_id = ?
         AND (
           (expires_at IS NOT NULL AND expires_at < NOW())
           OR (is_read = 1 AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY))
         )`,
      [userId, READ_RETENTION_DAYS],
    );
  },

  async getUserNotifications(userId) {
    await this.purgeForUser(userId);

    const [rows] = await db.query(
      `SELECT id, title, message, type, entity_type, entity_id, action_url,
              is_read, created_at, expires_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    );
    return rows.map(mapNotificationRow);
  },

  async getUnreadCount(userId) {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS count
       FROM notifications
       WHERE user_id = ? AND is_read = FALSE`,
      [userId],
    );
    return Number(rows[0]?.count) || 0;
  },

  async markAsRead(notificationId, userId) {
    const [result] = await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [notificationId, userId],
    );
    return result.affectedRows > 0;
  },

  async markAllAsRead(userId) {
    const [result] = await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
      [userId],
    );
    return result.affectedRows;
  },

  /**
   * Hard-delete one notification owned by the user.
   * @returns {boolean} true if deleted
   */
  async deleteOne(userId, notificationId) {
    const id = Number(notificationId);
    if (!Number.isInteger(id) || id < 1) {
      return false;
    }
    const [result] = await db.query(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    return result.affectedRows > 0;
  },

  /**
   * Create in-app notification with optional deep-link metadata.
   * @param {object} opts
   * @param {number} opts.userId
   * @param {string} opts.title
   * @param {string} opts.message
   * @param {string} [opts.type='system']
   * @param {string|null} [opts.entityType]
   * @param {number|null} [opts.entityId]
   * @param {string|null} [opts.actionUrl] path relativo (solo generado en servidor)
   * @param {Date|string|null} [opts.expiresAt]
   */
  async createNotification(opts) {
    const {
      userId,
      title,
      message,
      type = 'system',
      entityType = null,
      entityId = null,
      actionUrl = null,
      expiresAt = null,
    } = opts || {};

    const expires = expiresAt || defaultExpiresAt();

    const [result] = await db.query(
      `INSERT INTO notifications
         (user_id, title, message, type, entity_type, entity_id, action_url, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title,
        message,
        type,
        entityType,
        entityId,
        actionUrl,
        expires,
      ],
    );

    try {
      getPushService().notifyUserAsync(userId, {
        title,
        body: message,
        actionUrl,
        type,
      });
    } catch (error) {
      console.warn('[notifications] push fan-out:', error.message);
    }

    return result.insertId;
  },
};

module.exports = { notificationService, TTL_DAYS, READ_RETENTION_DAYS };
