const db = require('../../config/db');

const SEX_OPTIONS = ['Masculino', 'Femenino', 'Otro'];
const DEFAULT_AVATAR_MARKERS = new Set(['', 'default_avatar.png', 'null', 'undefined']);

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeFotoUrl(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed || DEFAULT_AVATAR_MARKERS.has(trimmed)) return null;
  return trimmed;
}

function formatDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (!str) return null;
  return str.slice(0, 10);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function isValidEmail(email) {
  return Boolean(email) && email.length <= 255 && EMAIL_RE.test(email);
}

function mapProfileRow(user, info) {
  return {
    user_id: user.id,
    nombre: user.nombre,
    username: user.username,
    email: user.email || null,
    rol: user.rol,
    telefono: info?.telefono ?? null,
    fecha_nacimiento: formatDateOnly(info?.fecha_nacimiento),
    sexo: info?.sexo ?? null,
    lesiones: info?.lesiones ?? null,
    objetivo: info?.objetivo ?? null,
    foto_url: normalizeFotoUrl(info?.foto_url),
    ultimo_acceso: info?.ultimo_acceso ?? null,
  };
}

/**
 * Client: only own profile. Trainer: only owned clients.
 */
async function assertCanAccessProfile(actor, targetUserId) {
  const [users] = await db.query(
    `SELECT id, nombre, username, email, rol, trainer_id
     FROM usuarios
     WHERE id = ?
     LIMIT 1`,
    [targetUserId],
  );

  if (users.length === 0) {
    throw createHttpError('Usuario no encontrado.', 404);
  }

  const target = users[0];

  if (actor.rol === 'client') {
    if (Number(actor.id) !== Number(targetUserId)) {
      throw createHttpError('No puedes ver ni editar el perfil de otro usuario.', 403);
    }
    return target;
  }

  if (actor.rol === 'trainer') {
    if (target.rol !== 'client' || Number(target.trainer_id) !== Number(actor.id)) {
      throw createHttpError('Cliente no encontrado o no pertenece a tu cuenta.', 404);
    }
    return target;
  }

  throw createHttpError('No tienes permiso para esta acción.', 403);
}

async function getProfile(actor, targetUserId) {
  const user = await assertCanAccessProfile(actor, targetUserId);

  const [rows] = await db.query(
    `SELECT id, user_id, telefono, fecha_nacimiento, sexo, lesiones, objetivo, foto_url, ultimo_acceso
     FROM alumnos_info
     WHERE user_id = ?
     LIMIT 1`,
    [targetUserId],
  );

  return mapProfileRow(user, rows[0] || null);
}

function normalizeProfilePayload(body = {}) {
  const telefono = body.telefono != null ? String(body.telefono).trim() : undefined;
  const objetivo = body.objetivo != null ? String(body.objetivo).trim() : undefined;
  const lesiones = body.lesiones != null ? String(body.lesiones).trim() : undefined;
  const sexoRaw = body.sexo != null ? String(body.sexo).trim() : undefined;
  const fechaRaw = body.fecha_nacimiento != null
    ? String(body.fecha_nacimiento).trim()
    : undefined;
  const emailProvided = body.email != null;
  const emailRaw = emailProvided ? normalizeEmail(body.email) : undefined;

  if (sexoRaw !== undefined && sexoRaw !== '' && !SEX_OPTIONS.includes(sexoRaw)) {
    throw createHttpError('Sexo inválido. Usa Masculino, Femenino u Otro.', 400);
  }

  if (fechaRaw !== undefined && fechaRaw !== '') {
    const parsed = new Date(fechaRaw);
    if (Number.isNaN(parsed.getTime())) {
      throw createHttpError('fecha_nacimiento inválida.', 400);
    }
  }

  if (telefono !== undefined && telefono.length > 20) {
    throw createHttpError('El teléfono no puede superar 20 caracteres.', 400);
  }

  if (objetivo !== undefined && objetivo.length > 100) {
    throw createHttpError('El objetivo no puede superar 100 caracteres.', 400);
  }

  if (emailProvided) {
    if (!emailRaw) {
      throw createHttpError('El correo electrónico no puede quedar vacío.', 400);
    }
    if (!isValidEmail(emailRaw)) {
      throw createHttpError('Debes indicar un correo electrónico válido.', 400);
    }
  }

  return {
    telefono: telefono === undefined ? undefined : (telefono || null),
    objetivo: objetivo === undefined ? undefined : (objetivo || null),
    lesiones: lesiones === undefined ? undefined : (lesiones || null),
    sexo: sexoRaw === undefined ? undefined : (sexoRaw || null),
    fecha_nacimiento: fechaRaw === undefined ? undefined : (fechaRaw || null),
    email: emailProvided ? emailRaw : undefined,
  };
}

function resolveAvatarPublicUrl(file) {
  if (!file?.filename) return null;
  return `/uploads/avatars/${file.filename}`;
}

async function upsertProfile(actor, targetUserId, body, uploadedFile) {
  const target = await assertCanAccessProfile(actor, targetUserId);
  const fields = normalizeProfilePayload(body);
  const fotoUrl = uploadedFile ? resolveAvatarPublicUrl(uploadedFile) : undefined;

  if (
    actor.rol === 'trainer'
    && fields.email !== undefined
    && fields.email !== normalizeEmail(target.email)
  ) {
    throw createHttpError(
      'Solo el cliente puede cambiar su correo de recuperación.',
      403,
    );
  }

  // El formulario del trainer reenvía el email visible aunque no haya cambiado.
  // No lo escribimos: el correo es una credencial de recuperación, no un dato
  // de perfil que el trainer pueda administrar.
  if (actor.rol === 'trainer') {
    fields.email = undefined;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (fields.email !== undefined) {
      const [dup] = await connection.query(
        'SELECT id FROM usuarios WHERE email = ? AND id <> ? LIMIT 1',
        [fields.email, targetUserId],
      );
      if (dup.length > 0) {
        throw createHttpError('El correo electrónico ya está en uso.', 400);
      }
      await connection.query(
        'UPDATE usuarios SET email = ? WHERE id = ?',
        [fields.email, targetUserId],
      );
    }

    const [existing] = await connection.query(
      'SELECT id, telefono, fecha_nacimiento, sexo, lesiones, objetivo, foto_url FROM alumnos_info WHERE user_id = ? LIMIT 1 FOR UPDATE',
      [targetUserId],
    );

    if (existing.length === 0) {
      await connection.query(
        `INSERT INTO alumnos_info
          (user_id, telefono, fecha_nacimiento, sexo, lesiones, objetivo, foto_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          targetUserId,
          fields.telefono ?? '',
          fields.fecha_nacimiento ?? null,
          fields.sexo ?? 'Otro',
          fields.lesiones ?? null,
          fields.objetivo ?? '',
          fotoUrl ?? null,
        ],
      );
    } else {
      const prev = existing[0];
      await connection.query(
        `UPDATE alumnos_info
         SET telefono = ?, fecha_nacimiento = ?, sexo = ?, lesiones = ?, objetivo = ?, foto_url = ?
         WHERE user_id = ?`,
        [
          fields.telefono !== undefined ? fields.telefono : prev.telefono,
          fields.fecha_nacimiento !== undefined ? fields.fecha_nacimiento : prev.fecha_nacimiento,
          fields.sexo !== undefined ? fields.sexo : prev.sexo,
          fields.lesiones !== undefined ? fields.lesiones : prev.lesiones,
          fields.objetivo !== undefined ? fields.objetivo : prev.objetivo,
          fotoUrl !== undefined ? fotoUrl : prev.foto_url,
          targetUserId,
        ],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getProfile(actor, targetUserId);
}

module.exports = {
  getProfile,
  upsertProfile,
  SEX_OPTIONS,
};
