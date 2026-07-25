const path = require('path');

const AVATARS_DIR = path.join(__dirname, '../../../public/uploads/avatars');
const AVATAR_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/**
 * @param {string} filename
 * @returns {string}
 */
function objectKey(filename) {
  return `avatars/${filename}`;
}

/**
 * @param {string} filename
 * @returns {string}
 */
function publicUrl(filename) {
  return `/uploads/avatars/${filename}`;
}

/**
 * @param {number|string} userId
 * @param {string} [originalname]
 * @param {string} [mimetype]
 * @returns {string}
 */
function buildAvatarFilename(userId, originalname = '', mimetype = '') {
  const fromName = path.extname(originalname || '').toLowerCase();
  let ext = AVATAR_EXTS.includes(fromName)
    ? (fromName === '.jpeg' ? '.jpg' : fromName)
    : '';
  if (!ext) {
    const mimeMap = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    ext = mimeMap[mimetype] || '.jpg';
  }
  return `user_${userId}${ext}`;
}

module.exports = {
  AVATARS_DIR,
  AVATAR_EXTS,
  objectKey,
  publicUrl,
  buildAvatarFilename,
};
