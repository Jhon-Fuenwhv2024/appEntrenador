const path = require('path');
const { randomUUID } = require('crypto');

const EXERCISES_DIR = path.join(__dirname, '../../../public/uploads/exercises');
const EXERCISE_GIF_RE = /^exercise_\d+\.gif$/i;
/** Trainer uploads: trainer_{trainerId}_{uuid}.{ext} */
const TRAINER_MEDIA_RE =
  /^trainer_\d+_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(gif|jpe?g|png|webp|mp4|webm)$/i;

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

const EXT_TO_MIME = {
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

/**
 * @param {string} filename
 * @returns {boolean}
 */
function isValidExerciseGifFilename(filename) {
  const safe = path.basename(filename || '');
  return EXERCISE_GIF_RE.test(safe);
}

/**
 * @param {string} filename
 * @returns {boolean}
 */
function isValidTrainerMediaFilename(filename) {
  const safe = path.basename(filename || '');
  return TRAINER_MEDIA_RE.test(safe);
}

/**
 * Catalog GIF or trainer-uploaded media under /uploads/exercises.
 * @param {string} filename
 * @returns {boolean}
 */
function isValidExerciseMediaFilename(filename) {
  return isValidExerciseGifFilename(filename) || isValidTrainerMediaFilename(filename);
}

/**
 * @param {string} mimetype
 * @returns {'image'|'gif'|'video'|null}
 */
function mediaTypeFromMimetype(mimetype) {
  const mime = String(mimetype || '').toLowerCase();
  if (mime === 'image/gif') return 'gif';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return null;
}

/**
 * @param {string} mimetype
 * @returns {string|null}
 */
function extensionFromMimetype(mimetype) {
  return MIME_TO_EXT[String(mimetype || '').toLowerCase()] || null;
}

/**
 * @param {number|string} trainerId
 * @param {string} mimetype
 * @returns {string}
 */
function buildTrainerMediaFilename(trainerId, mimetype) {
  const ext = extensionFromMimetype(mimetype);
  if (!ext) {
    throw new Error(`MIME no soportado para media de ejercicio: ${mimetype}`);
  }
  const id = Number(trainerId) || 0;
  return `trainer_${id}_${randomUUID()}.${ext}`;
}

/**
 * R2 object key for catalog / trainer media under exercises/.
 * @param {string} filename
 * @returns {string}
 */
function objectKey(filename) {
  return `exercises/${path.basename(filename)}`;
}

/**
 * Public relative URL stored in DB as local_media_path.
 * @param {string} filename
 * @returns {string}
 */
function publicUrl(filename) {
  return `/uploads/exercises/${path.basename(filename)}`;
}

/**
 * Absolute local path for a media filename.
 * @param {string} filename
 * @returns {string}
 */
function absolutePath(filename) {
  return path.join(EXERCISES_DIR, path.basename(filename));
}

/**
 * @param {string} filename
 * @returns {string}
 */
function contentTypeForFilename(filename) {
  const safe = path.basename(filename || '');
  const ext = path.extname(safe).slice(1).toLowerCase();
  return EXT_TO_MIME[ext] || 'application/octet-stream';
}

module.exports = {
  EXERCISES_DIR,
  EXERCISE_GIF_RE,
  TRAINER_MEDIA_RE,
  MIME_TO_EXT,
  isValidExerciseGifFilename,
  isValidTrainerMediaFilename,
  isValidExerciseMediaFilename,
  mediaTypeFromMimetype,
  extensionFromMimetype,
  buildTrainerMediaFilename,
  objectKey,
  publicUrl,
  absolutePath,
  contentTypeForFilename,
};
