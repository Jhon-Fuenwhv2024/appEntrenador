const path = require('path');
const { isR2Configured } = require('../../config/env');
const r2Driver = require('./r2Driver');
const localDriver = require('./localDriver');
const {
  AVATAR_EXTS,
  objectKey,
  publicUrl,
  buildAvatarFilename,
} = require('./avatarPaths');

/**
 * Remove other extension variants for the same user (best-effort).
 * @param {number|string} userId
 * @param {string} keepFilename
 */
async function deleteOtherExtensions(userId, keepFilename) {
  const keepExt = path.extname(keepFilename).toLowerCase();
  const candidates = AVATAR_EXTS
    .map((ext) => (ext === '.jpeg' ? '.jpg' : ext))
    .filter((ext, i, arr) => arr.indexOf(ext) === i && ext !== keepExt)
    .map((ext) => `user_${userId}${ext}`);

  await Promise.all(candidates.map(async (filename) => {
    try {
      if (isR2Configured) {
        await r2Driver.deleteObject(objectKey(filename));
      } else {
        await localDriver.deleteAvatarFile(filename);
      }
    } catch (error) {
      console.warn('[avatarStorage] cleanup other ext failed:', filename, error.message);
    }
  }));
}

/**
 * Persist uploaded avatar (R2 when configured; local disk otherwise).
 * Ensures `file.filename` and returns public relative URL.
 * @param {{ userId: number|string, file: object }} opts
 * @returns {Promise<string>}
 */
async function putAvatar({ userId, file }) {
  if (!file) {
    throw new Error('No hay archivo de avatar.');
  }

  const filename = file.filename
    || buildAvatarFilename(userId, file.originalname, file.mimetype);
  file.filename = filename;

  const contentType = file.mimetype || 'application/octet-stream';

  if (isR2Configured) {
    const body = file.buffer;
    if (!body || !Buffer.isBuffer(body)) {
      throw new Error('Avatar en memoria requerido para R2.');
    }
    await r2Driver.putObject(objectKey(filename), body, contentType);
  } else if (file.buffer && Buffer.isBuffer(file.buffer)) {
    await localDriver.putAvatarFile(filename, file.buffer);
  }
  // diskStorage: Multer already wrote the file under AVATARS_DIR

  await deleteOtherExtensions(userId, filename);
  return publicUrl(filename);
}

/**
 * Fetch avatar from R2 for the JWT proxy. Returns null if missing.
 * @param {string} filename
 */
async function getAvatarFromR2(filename) {
  if (!isR2Configured) return null;
  const safe = path.basename(filename);
  if (!/^user_\d+\.(jpg|jpeg|png|webp|gif)$/i.test(safe)) {
    return null;
  }
  return r2Driver.getObject(objectKey(safe));
}

module.exports = {
  putAvatar,
  getAvatarFromR2,
  buildAvatarFilename,
  publicUrl,
  objectKey,
  isR2Configured,
};
