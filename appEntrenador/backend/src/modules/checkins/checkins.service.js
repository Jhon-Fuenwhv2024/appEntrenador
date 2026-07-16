const fs = require('fs');
const path = require('path');
const db = require('../../config/db');
const clientsService = require('../clients/clients.service');
const {
  PHOTOS_DIR,
  resolvePhotoPublicUrl,
} = require('../../middleware/uploadProgressPhotos');

const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const POSE_TYPES = new Set(['front', 'side', 'back']);

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function parsePositiveId(value, fieldLabel) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError(`${fieldLabel} inválido.`, 400);
  }
  return id;
}

function parseLocalDateString(value, fieldLabel = 'created_at') {
  if (value == null || value === '') {
    throw createHttpError(`${fieldLabel} es obligatorio (YYYY-MM-DD).`, 400);
  }

  const raw = String(value).trim();
  if (!LOCAL_DATE_RE.test(raw)) {
    throw createHttpError(`${fieldLabel} debe tener formato YYYY-MM-DD.`, 400);
  }

  const [y, m, d] = raw.split('-').map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y
    || probe.getUTCMonth() !== m - 1
    || probe.getUTCDate() !== d
  ) {
    throw createHttpError(`${fieldLabel} no es una fecha válida.`, 400);
  }

  return raw;
}

function todayLocalDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseRating(value, fieldLabel) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw createHttpError(`${fieldLabel} debe ser un entero entre 1 y 5.`, 400);
  }
  return n;
}

function normalizeNotes(notes) {
  if (notes == null || notes === '') return null;
  if (typeof notes !== 'string') {
    throw createHttpError('notes debe ser texto.', 400);
  }
  const trimmed = notes.trim();
  if (trimmed.length > 2000) {
    throw createHttpError('notes no puede superar 2000 caracteres.', 400);
  }
  return trimmed || null;
}

function formatDateField(value) {
  if (value == null) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const raw = String(value);
  if (LOCAL_DATE_RE.test(raw.slice(0, 10))) {
    return raw.slice(0, 10);
  }
  return raw;
}

function mapPhotoRow(row) {
  return {
    id: Number(row.id),
    client_id: Number(row.client_id),
    checkin_id: row.checkin_id != null ? Number(row.checkin_id) : null,
    image_url: row.image_url,
    pose_type: row.pose_type,
    taken_at: formatDateField(row.taken_at),
  };
}

function mapCheckinRow(row, photos = []) {
  return {
    id: Number(row.id),
    client_id: Number(row.client_id),
    created_at: formatDateField(row.created_at),
    sleep_quality: Number(row.sleep_quality),
    stress_level: Number(row.stress_level),
    diet_adherence: Number(row.diet_adherence),
    notes: row.notes ?? null,
    photos: photos.map(mapPhotoRow),
  };
}

/**
 * Extrae archivos multer (fields front/side/back) como lista tipada.
 * @param {Record<string, Express.Multer.File[]>|undefined} filesByField
 */
function collectPoseFiles(filesByField) {
  if (!filesByField || typeof filesByField !== 'object') return [];

  const collected = [];
  for (const pose of ['front', 'side', 'back']) {
    const list = filesByField[pose];
    if (Array.isArray(list) && list[0]) {
      collected.push({ pose_type: pose, file: list[0] });
    }
  }
  return collected;
}

function unlinkQuietly(absolutePath) {
  try {
    if (absolutePath && fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch {
    // best-effort cleanup
  }
}

/**
 * POST /api/checkins — cliente autenticado crea check-in (+ fotos opcionales).
 */
async function createForClient(clientId, body, filesByField) {
  const sleepQuality = parseRating(body?.sleep_quality, 'sleep_quality');
  const stressLevel = parseRating(body?.stress_level, 'stress_level');
  const dietAdherence = parseRating(body?.diet_adherence, 'diet_adherence');
  const notes = normalizeNotes(body?.notes);
  const createdAt = body?.created_at
    ? parseLocalDateString(body.created_at, 'created_at')
    : todayLocalDateString();

  const poseFiles = collectPoseFiles(filesByField);
  for (const item of poseFiles) {
    if (!POSE_TYPES.has(item.pose_type)) {
      throw createHttpError('pose_type inválido.', 400);
    }
  }

  const connection = await db.getConnection();
  const savedPaths = [];

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO weekly_checkins
        (client_id, created_at, sleep_quality, stress_level, diet_adherence, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [clientId, createdAt, sleepQuality, stressLevel, dietAdherence, notes],
    );

    const checkinId = result.insertId;
    const photos = [];

    for (const { pose_type, file } of poseFiles) {
      const imageUrl = resolvePhotoPublicUrl(file.filename);
      savedPaths.push(path.join(PHOTOS_DIR, file.filename));

      const [photoResult] = await connection.execute(
        `INSERT INTO progress_photos
          (client_id, checkin_id, image_url, pose_type, taken_at)
         VALUES (?, ?, ?, ?, ?)`,
        [clientId, checkinId, imageUrl, pose_type, createdAt],
      );

      photos.push({
        id: Number(photoResult.insertId),
        client_id: Number(clientId),
        checkin_id: Number(checkinId),
        image_url: imageUrl,
        pose_type,
        taken_at: createdAt,
      });
    }

    await connection.commit();

    return mapCheckinRow(
      {
        id: checkinId,
        client_id: clientId,
        created_at: createdAt,
        sleep_quality: sleepQuality,
        stress_level: stressLevel,
        diet_adherence: dietAdherence,
        notes,
      },
      photos,
    );
  } catch (error) {
    await connection.rollback();
    for (const abs of savedPaths) {
      unlinkQuietly(abs);
    }
    // Also remove any multer files that never reached DB insert
    for (const { file } of poseFiles) {
      if (file?.path) unlinkQuietly(file.path);
    }
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * GET /api/checkins/client/:clientId — historial con fotos.
 * Trainer: solo alumnos propios. Client: solo su propio id.
 */
async function listByClient(requester, clientIdParam) {
  const clientId = parsePositiveId(clientIdParam, 'clientId');

  if (requester.rol === 'client') {
    if (Number(requester.id) !== clientId) {
      throw createHttpError('No puedes ver check-ins de otro usuario.', 403);
    }
  } else if (requester.rol === 'trainer') {
    await clientsService.getClientOwnedByTrainer(clientId, requester.id);
  } else {
    throw createHttpError('Rol no autorizado.', 403);
  }

  const [checkinRows] = await db.query(
    `SELECT id, client_id, created_at, sleep_quality, stress_level, diet_adherence, notes
     FROM weekly_checkins
     WHERE client_id = ?
     ORDER BY created_at DESC, id DESC`,
    [clientId],
  );

  if (checkinRows.length === 0) {
    return [];
  }

  const checkinIds = checkinRows.map((r) => Number(r.id));
  const placeholders = checkinIds.map(() => '?').join(',');

  const [photoRows] = await db.query(
    `SELECT id, client_id, checkin_id, image_url, pose_type, taken_at
     FROM progress_photos
     WHERE client_id = ? AND checkin_id IN (${placeholders})
     ORDER BY FIELD(pose_type, 'front', 'side', 'back'), id ASC`,
    [clientId, ...checkinIds],
  );

  const photosByCheckin = new Map();
  for (const photo of photoRows) {
    const key = Number(photo.checkin_id);
    if (!photosByCheckin.has(key)) {
      photosByCheckin.set(key, []);
    }
    photosByCheckin.get(key).push(photo);
  }

  return checkinRows.map((row) => (
    mapCheckinRow(row, photosByCheckin.get(Number(row.id)) || [])
  ));
}

module.exports = {
  createForClient,
  listByClient,
  parseLocalDateString,
  todayLocalDateString,
};
