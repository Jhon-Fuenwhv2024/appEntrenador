const fs = require('fs');
const path = require('path');
const { isR2Configured } = require('../../config/env');
const r2Driver = require('./r2Driver');
const {
  EXERCISES_DIR,
  isValidExerciseGifFilename,
  isValidTrainerMediaFilename,
  isValidExerciseMediaFilename,
  buildTrainerMediaFilename,
  mediaTypeFromMimetype,
  objectKey,
  publicUrl,
  absolutePath,
  contentTypeForFilename,
} = require('./exerciseMediaPaths');

/**
 * Persist an exercise GIF to R2 (when configured) and/or local disk.
 * @param {{ filename: string, buffer?: Buffer|null, filePath?: string|null }} opts
 * @returns {Promise<string>} public relative URL
 */
async function putExerciseGif({ filename, buffer = null, filePath = null }) {
  const safe = path.basename(filename || '');
  if (!isValidExerciseGifFilename(safe)) {
    throw new Error(`Nombre de GIF de ejercicio inválido: ${filename}`);
  }

  let body = buffer;
  if ((!body || !Buffer.isBuffer(body)) && filePath) {
    body = await fs.promises.readFile(filePath);
  }
  if (!body || !Buffer.isBuffer(body)) {
    throw new Error('Buffer o filePath requerido para putExerciseGif.');
  }

  if (isR2Configured) {
    await r2Driver.putObject(objectKey(safe), body, 'image/gif');
  }

  // Always keep a local copy in dev / when R2 is off; also useful as serve fallback.
  if (!isR2Configured || filePath == null) {
    await fs.promises.mkdir(EXERCISES_DIR, { recursive: true });
    const dest = absolutePath(safe);
    if (!filePath || path.resolve(filePath) !== path.resolve(dest)) {
      await fs.promises.writeFile(dest, body);
    }
  }

  return publicUrl(safe);
}

/**
 * Persist trainer-uploaded exercise media (image/gif/video).
 * @param {{
 *   trainerId: number,
 *   mimetype: string,
 *   buffer?: Buffer|null,
 *   filePath?: string|null,
 *   filename?: string|null,
 * }} opts
 * @returns {Promise<{ publicUrl: string, filename: string, mediaType: string }>}
 */
async function putTrainerExerciseMedia({
  trainerId,
  mimetype,
  buffer = null,
  filePath = null,
  filename = null,
}) {
  const mediaType = mediaTypeFromMimetype(mimetype);
  if (!mediaType) {
    throw new Error(`Tipo de archivo no permitido: ${mimetype}`);
  }

  const safe = filename
    ? path.basename(filename)
    : buildTrainerMediaFilename(trainerId, mimetype);

  if (!isValidTrainerMediaFilename(safe)) {
    throw new Error(`Nombre de media de trainer inválido: ${safe}`);
  }

  let body = buffer;
  if ((!body || !Buffer.isBuffer(body)) && filePath) {
    body = await fs.promises.readFile(filePath);
  }
  if (!body || !Buffer.isBuffer(body)) {
    throw new Error('Buffer o filePath requerido para putTrainerExerciseMedia.');
  }

  const contentType = contentTypeForFilename(safe);

  if (isR2Configured) {
    await r2Driver.putObject(objectKey(safe), body, contentType);
  }

  if (!isR2Configured || filePath == null) {
    await fs.promises.mkdir(EXERCISES_DIR, { recursive: true });
    const dest = absolutePath(safe);
    if (!filePath || path.resolve(filePath) !== path.resolve(dest)) {
      await fs.promises.writeFile(dest, body);
    }
  }

  return {
    publicUrl: publicUrl(safe),
    filename: safe,
    mediaType,
  };
}

/**
 * Upload an existing local GIF file to R2 only (migration / scraper after disk write).
 * @param {string} filename
 * @param {string} [localPath] defaults to EXERCISES_DIR/filename
 * @returns {Promise<{ uploaded: boolean, skipped?: boolean, reason?: string }>}
 */
async function putLocalExerciseGifToR2(filename, localPath = null) {
  const safe = path.basename(filename || '');
  if (!isValidExerciseGifFilename(safe)) {
    return { uploaded: false, skipped: true, reason: 'invalid-filename' };
  }
  if (!isR2Configured) {
    return { uploaded: false, skipped: true, reason: 'r2-not-configured' };
  }

  const src = localPath || absolutePath(safe);
  try {
    await fs.promises.access(src, fs.constants.R_OK);
  } catch {
    return { uploaded: false, skipped: true, reason: 'file-missing' };
  }

  const exists = await r2Driver.headObject(objectKey(safe));
  if (exists) {
    return { uploaded: false, skipped: true, reason: 'already-in-r2' };
  }

  const body = await fs.promises.readFile(src);
  await r2Driver.putObject(objectKey(safe), body, 'image/gif');
  return { uploaded: true };
}

/**
 * Fetch exercise media from R2 for the public proxy. Returns null if missing/invalid.
 * @param {string} filename
 */
async function getExerciseGifFromR2(filename) {
  if (!isR2Configured) return null;
  const safe = path.basename(filename || '');
  if (!isValidExerciseMediaFilename(safe)) return null;
  return r2Driver.getObject(objectKey(safe));
}

module.exports = {
  putExerciseGif,
  putTrainerExerciseMedia,
  putLocalExerciseGifToR2,
  getExerciseGifFromR2,
  isR2Configured,
  publicUrl,
  objectKey,
  EXERCISES_DIR,
};
