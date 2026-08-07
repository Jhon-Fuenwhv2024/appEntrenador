const crypto = require('crypto');
const db = require('../../config/db');
const { assertRedis } = require('../../config/redis');
const membershipsService = require('../memberships/memberships.service');
const shadowSettingsService = require('./shadow-settings.service');

const LIVE_TTL_SECONDS = 45;
const CUE_RATE_LIMIT_SECONDS = 10;
const MAX_CUE_LENGTH = 120;
const ALLOWED_TONES = new Set(['tip', 'form', 'motivation', 'stop']);
const ALLOWED_PHASES = new Set(['working', 'resting']);

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function liveKey(clientId) {
  return `shadow:live:${clientId}`;
}

function idxKey(trainerId) {
  return `shadow:idx:${trainerId}`;
}

function cueRateKey(clientId) {
  return `shadow:rl:cue:${clientId}`;
}

function parseLive(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function getClientRow(clientId) {
  const [rows] = await db.query(
    `SELECT id, nombre, trainer_id, rol
     FROM usuarios
     WHERE id = ? AND rol = 'client'
     LIMIT 1`,
    [clientId],
  );
  return rows[0] || null;
}

/**
 * Client upserts live snapshot. Returns any pending cue (and clears it).
 */
async function upsertMyLive(clientId, payload = {}) {
  const redis = assertRedis();

  const enabled = await shadowSettingsService.isShadowEnabled(clientId);
  if (!enabled) {
    throw createHttpError('Has desactivado el modo sombra.', 403);
  }

  await membershipsService.assertClientMembershipAccess(clientId);

  const client = await getClientRow(clientId);
  if (!client) {
    throw createHttpError('Cliente no encontrado.', 404);
  }
  if (!client.trainer_id) {
    throw createHttpError('No tienes entrenador asignado.', 400);
  }

  const phase = typeof payload.phase === 'string' ? payload.phase.trim() : '';
  if (!ALLOWED_PHASES.has(phase)) {
    throw createHttpError('phase debe ser working o resting.', 400);
  }

  const exerciseName = typeof payload.exerciseName === 'string'
    ? payload.exerciseName.trim().slice(0, 150)
    : '';
  if (!exerciseName) {
    throw createHttpError('exerciseName es obligatorio.', 400);
  }

  const exerciseIndex = Number(payload.exerciseIndex);
  const setIndex = Number(payload.setIndex);
  if (!Number.isInteger(exerciseIndex) || exerciseIndex < 0) {
    throw createHttpError('exerciseIndex inválido.', 400);
  }
  if (!Number.isInteger(setIndex) || setIndex < 0) {
    throw createHttpError('setIndex inválido.', 400);
  }

  let restEndsAt = null;
  if (payload.restEndsAt != null && payload.restEndsAt !== '') {
    const parsed = new Date(payload.restEndsAt);
    if (Number.isNaN(parsed.getTime())) {
      throw createHttpError('restEndsAt inválido.', 400);
    }
    restEndsAt = parsed.toISOString();
  }

  const routineName = typeof payload.routineName === 'string'
    ? payload.routineName.trim().slice(0, 100)
    : '';

  const key = liveKey(clientId);
  const existing = parseLive(await redis.get(key));
  const pendingCue = existing?.pendingCue || null;

  const doc = {
    clientId: Number(clientId),
    clientName: client.nombre || 'Alumno',
    trainerId: Number(client.trainer_id),
    routineName,
    exerciseName,
    exerciseIndex,
    setIndex,
    phase,
    restEndsAt,
    updatedAt: new Date().toISOString(),
    pendingCue: null,
  };

  const pipeline = redis.pipeline();
  pipeline.setex(key, LIVE_TTL_SECONDS, JSON.stringify(doc));
  pipeline.sadd(idxKey(client.trainer_id), String(clientId));
  await pipeline.exec();

  return {
    ok: true,
    cue: pendingCue,
  };
}

/**
 * Client clears live presence (finished / leave player).
 */
async function clearMyLive(clientId) {
  const redis = assertRedis();
  const client = await getClientRow(clientId);
  const key = liveKey(clientId);

  const pipeline = redis.pipeline();
  pipeline.del(key);
  if (client?.trainer_id) {
    pipeline.srem(idxKey(client.trainer_id), String(clientId));
  }
  await pipeline.exec();

  return { ok: true };
}

/**
 * Trainer lists own clients currently live (fresh TTL).
 */
async function listLiveForTrainer(trainerId) {
  const redis = assertRedis();
  const tid = Number(trainerId);
  const members = await redis.smembers(idxKey(tid));
  if (!members.length) {
    return [];
  }

  const pipeline = redis.pipeline();
  for (const id of members) {
    pipeline.get(liveKey(id));
  }
  const results = await pipeline.exec();

  const sessions = [];
  const stale = [];

  members.forEach((id, index) => {
    const [err, raw] = results[index] || [];
    if (err || !raw) {
      stale.push(id);
      return;
    }
    const doc = parseLive(raw);
    if (!doc || Number(doc.trainerId) !== tid) {
      stale.push(id);
      return;
    }
    sessions.push({
      clientId: doc.clientId,
      clientName: doc.clientName,
      routineName: doc.routineName,
      exerciseName: doc.exerciseName,
      exerciseIndex: doc.exerciseIndex,
      setIndex: doc.setIndex,
      phase: doc.phase,
      restEndsAt: doc.restEndsAt,
      updatedAt: doc.updatedAt,
      hasPendingCue: Boolean(doc.pendingCue),
    });
  });

  if (stale.length) {
    await redis.srem(idxKey(tid), ...stale);
  }

  sessions.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return sessions;
}

/**
 * Trainer sends a short cue to a live client (rate-limited, ephemeral).
 */
async function postCue(trainerId, clientId, payload = {}) {
  const redis = assertRedis();
  const tid = Number(trainerId);
  const cid = Number(clientId);

  if (!Number.isInteger(cid) || cid < 1) {
    throw createHttpError('clientId inválido.', 400);
  }

  const client = await getClientRow(cid);
  if (!client || Number(client.trainer_id) !== tid) {
    throw createHttpError('No puedes enviar cues a este alumno.', 403);
  }

  const enabled = await shadowSettingsService.isShadowEnabled(cid);
  if (!enabled) {
    throw createHttpError('El alumno desactivó el modo sombra.', 403);
  }

  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  if (!body) {
    throw createHttpError('body es obligatorio.', 400);
  }
  if (body.length > MAX_CUE_LENGTH) {
    throw createHttpError(`body máximo ${MAX_CUE_LENGTH} caracteres.`, 400);
  }

  const tone = typeof payload.tone === 'string' ? payload.tone.trim() : 'tip';
  if (!ALLOWED_TONES.has(tone)) {
    throw createHttpError('tone inválido.', 400);
  }

  const rlOk = await redis.set(
    cueRateKey(cid),
    '1',
    'EX',
    CUE_RATE_LIMIT_SECONDS,
    'NX',
  );
  if (rlOk !== 'OK') {
    throw createHttpError(
      `Espera ${CUE_RATE_LIMIT_SECONDS}s entre cues para este alumno.`,
      429,
    );
  }

  const key = liveKey(cid);
  const existing = parseLive(await redis.get(key));
  if (!existing || Number(existing.trainerId) !== tid) {
    throw createHttpError('El alumno no está en una sesión live ahora.', 404);
  }

  const cue = {
    id: crypto.randomUUID(),
    body,
    tone,
    createdAt: new Date().toISOString(),
  };

  existing.pendingCue = cue;
  existing.updatedAt = new Date().toISOString();
  await redis.setex(key, LIVE_TTL_SECONDS, JSON.stringify(existing));

  return { cue };
}

module.exports = {
  upsertMyLive,
  clearMyLive,
  listLiveForTrainer,
  postCue,
  LIVE_TTL_SECONDS,
  CUE_RATE_LIMIT_SECONDS,
  MAX_CUE_LENGTH,
};
