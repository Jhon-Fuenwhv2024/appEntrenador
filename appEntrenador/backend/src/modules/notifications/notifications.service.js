const db = require('../../config/db');

const notificationService = {
  async getUserNotifications(userId) {
    const [rows] = await db.query(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    );
    return rows.map((row) => ({
      ...row,
      is_read: Boolean(row.is_read),
    }));
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

  async createNotification(userId, title, message, type = 'system') {
    const [result] = await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [userId, title, message, type],
    );
    return result.insertId;
  },
};

module.exports = { notificationService };
