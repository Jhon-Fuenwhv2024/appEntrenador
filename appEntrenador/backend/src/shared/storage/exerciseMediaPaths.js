const path = require('path');

const EXERCISES_DIR = path.join(__dirname, '../../../public/uploads/exercises');
const EXERCISE_GIF_RE = /^exercise_\d+\.gif$/i;

/**
 * @param {string} filename
 * @returns {boolean}
 */
function isValidExerciseGifFilename(filename) {
  const safe = path.basename(filename || '');
  return EXERCISE_GIF_RE.test(safe);
}

/**
 * R2 object key for a catalog exercise GIF.
 * @param {string} filename e.g. exercise_12.gif
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
 * Absolute local path for a GIF filename.
 * @param {string} filename
 * @returns {string}
 */
function absolutePath(filename) {
  return path.join(EXERCISES_DIR, path.basename(filename));
}

module.exports = {
  EXERCISES_DIR,
  EXERCISE_GIF_RE,
  isValidExerciseGifFilename,
  objectKey,
  publicUrl,
  absolutePath,
};
