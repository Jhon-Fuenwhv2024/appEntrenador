const fs = require('fs');
const path = require('path');
const { AVATARS_DIR } = require('./avatarPaths');

function ensureAvatarsDir() {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

/**
 * Local FS put — Multer diskStorage already wrote the file; this writes
 * when we receive a memory buffer (edge case / tests).
 * @param {string} filename
 * @param {Buffer|null} body
 */
async function putAvatarFile(filename, body) {
  if (!body || !Buffer.isBuffer(body)) return;
  ensureAvatarsDir();
  const dest = path.join(AVATARS_DIR, filename);
  await fs.promises.writeFile(dest, body);
}

/**
 * Best-effort delete of a local avatar file.
 * @param {string} filename
 */
async function deleteAvatarFile(filename) {
  try {
    await fs.promises.unlink(path.join(AVATARS_DIR, filename));
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('[avatarStorage/local] delete failed:', error.message);
    }
  }
}

module.exports = {
  putAvatarFile,
  deleteAvatarFile,
  ensureAvatarsDir,
  AVATARS_DIR,
};
