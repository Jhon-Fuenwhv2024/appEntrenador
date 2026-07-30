const db = require('../../config/db');

/**
 * Claim a one-shot notification key for a user.
 * Inserts into notification_dedupe; returns false if already claimed (unique).
 */
async function claim(userId, key) {
  const uid = Number(userId);
  const dedupeKey = typeof key === 'string' ? key.trim() : '';
  if (!Number.isInteger(uid) || uid < 1 || !dedupeKey || dedupeKey.length > 80) {
    return false;
  }

  try {
    await db.query(
      `INSERT INTO notification_dedupe (user_id, dedupe_key) VALUES (?, ?)`,
      [uid, dedupeKey],
    );
    return true;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return false;
    }
    throw error;
  }
}

module.exports = {
  claim,
};
