const db = require('../../config/db');
const { notificationService } = require('../notifications/notifications.service');
const dedupeService = require('./dedupe.service');
const notificationSettingsService = require('./notification-settings.service');
const { sendMail, isSmtpConfigured } = require('../../shared/mail/mailer');
const { APP_PUBLIC_URL } = require('../../config/env');
const {
  DEFAULT_TIMEZONE,
  getZonedParts,
  toZonedDateStr,
  addDaysToDateStr,
  normalizeTimeZone,
} = require('./timezone');

const MEMBERSHIP_ALERT_HOUR = 9;
const STREAK_ALERT_HOUR = 9;
const WEEKLY_DIGEST_HOUR = 9;
/** Monday in weekdayEs from getZonedParts */
const WEEKLY_DIGEST_WEEKDAY = 'Lunes';
const WORKOUT_WINDOW_MINUTES = 5;
/** Alineado con memberships.service / access.js (Feature 080). */
const MEMBERSHIP_ACCESS_GRACE_DAYS = 3;

/**
 * True if client finished this routine on the given local civil date.
 * Mirrors routines.service hasCompletedRoutineOnDate, with TZ-aware date match.
 */
async function hasCompletedRoutineOnLocalDate(clientId, routineId, dateStr, timeZone) {
  if (!routineId) return false;

  const [rows] = await db.query(
    `SELECT finished_at, created_at
     FROM workout_sessions
     WHERE client_id = ?
       AND routine_id = ?
       AND status = 'completed'
       AND COALESCE(finished_at, created_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 DAY)`,
    [clientId, routineId],
  );

  return rows.some((row) => {
    const key = toZonedDateStr(row.finished_at || row.created_at, timeZone);
    return key === dateStr;
  });
}

/**
 * Any completed workout on a local civil date (consistency-style finished timestamps).
 */
async function hasCompletedAnyWorkoutOnLocalDate(clientId, dateStr, timeZone) {
  const [rows] = await db.query(
    `SELECT finished_at, created_at
     FROM workout_sessions
     WHERE client_id = ?
       AND status = 'completed'
       AND COALESCE(finished_at, created_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 4 DAY)`,
    [clientId],
  );

  return rows.some((row) => {
    const key = toZonedDateStr(row.finished_at || row.created_at, timeZone);
    return key === dateStr;
  });
}

async function listClientsForJobs() {
  const [rows] = await db.query(
    `SELECT
       u.id AS client_id,
       u.nombre,
       u.email,
       u.trainer_id,
       COALESCE(s.workout_reminder_enabled, 1) AS workout_reminder_enabled,
       COALESCE(s.workout_reminder_hour, 8) AS workout_reminder_hour,
       COALESCE(s.timezone, ?) AS timezone,
       cs.current_streak,
       cs.week_goal,
       cm.status AS membership_status,
       cm.period_end,
       DATEDIFF(cm.period_end, CURDATE()) AS days_remaining,
       cgm.gym_name AS gym_name,
       cgm.expires_on AS gym_expires_on,
       cgm.notify_enabled AS gym_notify_enabled,
       DATEDIFF(cgm.expires_on, CURDATE()) AS gym_days_remaining
     FROM usuarios u
     LEFT JOIN client_notification_settings s ON s.client_id = u.id
     LEFT JOIN client_streaks cs ON cs.client_id = u.id
     LEFT JOIN client_memberships cm ON cm.client_id = u.id
     LEFT JOIN client_gym_memberships cgm ON cgm.client_id = u.id
     WHERE u.rol = 'client'`,
    [DEFAULT_TIMEZONE],
  );
  return rows;
}

async function processWorkoutReminder(client) {
  const enabled = Boolean(Number(client.workout_reminder_enabled));
  if (!enabled) return;

  const tz = normalizeTimeZone(client.timezone);
  const parts = getZonedParts(tz);

  const reminderHour = Number(client.workout_reminder_hour ?? 8);
  if (parts.hour !== reminderHour) return;
  if (parts.minute >= WORKOUT_WINDOW_MINUTES) return;

  const claimed = await dedupeService.claim(
    client.client_id,
    `workout_reminder:${parts.dateStr}`,
  );
  if (!claimed) return;

  const [routines] = await db.query(
    `SELECT id, nombre_rutina
     FROM rutinas
     WHERE alumno_id = ? AND dia_semana = ?
     LIMIT 1`,
    [client.client_id, parts.weekdayEs],
  );

  const routine = routines[0];
  if (!routine) return;

  const done = await hasCompletedRoutineOnLocalDate(
    client.client_id,
    routine.id,
    parts.dateStr,
    tz,
  );
  if (done) return;

  const nombre = routine.nombre_rutina || 'tu rutina';
  await notificationService.createNotification({
    userId: client.client_id,
    title: 'Hoy toca entrenar',
    message: `Tienes pendiente «${nombre}». ¡Vamos!`,
    type: 'workout_reminder',
    entityType: 'routine',
    entityId: Number(routine.id),
    actionUrl: '/dashboard',
  });
}

async function processMembershipAlerts(client) {
  const tz = normalizeTimeZone(client.timezone);
  const parts = getZonedParts(tz);
  if (parts.hour !== MEMBERSHIP_ALERT_HOUR) return;
  if (parts.minute >= WORKOUT_WINDOW_MINUTES) return;

  const status = client.membership_status;
  if (!status && client.period_end == null) return;

  const daysRemaining =
    client.days_remaining == null ? null : Number(client.days_remaining);
  const alumnoName = client.nombre || 'tu alumno';
  const trainerId = client.trainer_id != null ? Number(client.trainer_id) : null;

  // Periodo terminado: gracia (días -1..-3) vs vencida fuera de gracia (<= -4).
  const pastEnd = daysRemaining != null && Number.isFinite(daysRemaining) && daysRemaining < 0
    ? -daysRemaining
    : 0;
  const inGrace = pastEnd >= 1 && pastEnd <= MEMBERSHIP_ACCESS_GRACE_DAYS;
  const pastGrace = pastEnd > MEMBERSHIP_ACCESS_GRACE_DAYS
    || (status === 'expired' && pastEnd === 0 && daysRemaining == null);

  if (inGrace) {
    const graceLeft = MEMBERSHIP_ACCESS_GRACE_DAYS - pastEnd + 1;
    const clientClaimed = await dedupeService.claim(
      client.client_id,
      `membership:grace:${parts.dateStr}`,
    );
    if (clientClaimed) {
      await notificationService.createNotification({
        userId: client.client_id,
        title: graceLeft === 1
          ? 'Último día de gracia'
          : `Periodo de gracia: ${graceLeft} días`,
        message: graceLeft === 1
          ? 'Tu plan terminó. Hoy es el último día de acceso — renueva con tu entrenador.'
          : `Tu plan terminó, pero aún tienes ${graceLeft} días de acceso. Renueva con tu entrenador antes de que se corte.`,
        type: 'membership_grace',
        entityType: 'membership',
        entityId: client.client_id,
        actionUrl: '/dashboard',
      });
    }

    if (trainerId) {
      const trainerClaimed = await dedupeService.claim(
        trainerId,
        `membership_trainer:${client.client_id}:grace:${parts.dateStr}`,
      );
      if (trainerClaimed) {
        await notificationService.createNotification({
          userId: trainerId,
          title: 'Alumno en gracia',
          message: graceLeft === 1
            ? `${alumnoName} está en el último día de gracia de membresía.`
            : `${alumnoName} tiene ${graceLeft} días de gracia de membresía.`,
          type: 'membership_grace',
          entityType: 'membership',
          entityId: client.client_id,
          actionUrl: '/trainer/clients',
        });
      }
    }
    return;
  }

  if (pastGrace || status === 'expired' || (daysRemaining != null && daysRemaining < -MEMBERSHIP_ACCESS_GRACE_DAYS)) {
    const clientClaimed = await dedupeService.claim(
      client.client_id,
      `membership:expired:${parts.dateStr}`,
    );
    if (clientClaimed) {
      await notificationService.createNotification({
        userId: client.client_id,
        title: 'Tu membresía está vencida',
        message: 'El periodo de gracia terminó. Renueva tu plan para seguir entrenando con tu entrenador.',
        type: 'membership_expired',
        entityType: 'membership',
        entityId: client.client_id,
        actionUrl: '/dashboard',
      });
    }

    if (trainerId) {
      const trainerClaimed = await dedupeService.claim(
        trainerId,
        `membership_trainer:${client.client_id}:expired:${parts.dateStr}`,
      );
      if (trainerClaimed) {
        await notificationService.createNotification({
          userId: trainerId,
          title: 'Membresía vencida',
          message: `La membresía de ${alumnoName} está vencida (gracia agotada).`,
          type: 'membership_expired',
          entityType: 'membership',
          entityId: client.client_id,
          actionUrl: '/trainer/clients',
        });
      }
    }
    return;
  }

  if (status !== 'active' || daysRemaining == null) return;
  if (![7, 3, 1].includes(daysRemaining)) return;

  const clientClaimed = await dedupeService.claim(
    client.client_id,
    `membership:${daysRemaining}:${parts.dateStr}`,
  );
  if (clientClaimed) {
    await notificationService.createNotification({
      userId: client.client_id,
      title: `Tu plan vence en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`,
      message: `Tu membresía vence en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}. Habla con tu entrenador si necesitas renovar.`,
      type: 'membership_expiring',
      entityType: 'membership',
      entityId: client.client_id,
      actionUrl: '/dashboard',
    });
  }

  if (trainerId) {
    const trainerClaimed = await dedupeService.claim(
      trainerId,
      `membership_trainer:${client.client_id}:${daysRemaining}:${parts.dateStr}`,
    );
    if (trainerClaimed) {
      await notificationService.createNotification({
        userId: trainerId,
        title: `Plan por vencer (${daysRemaining}d)`,
        message: `La membresía de ${alumnoName} vence en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}.`,
        type: 'membership_expiring',
        entityType: 'membership',
        entityId: client.client_id,
        actionUrl: '/trainer/clients',
      });
    }
  }
}

async function processGymMembershipAlert(client) {
  if (client.gym_expires_on == null) return;
  if (!Boolean(Number(client.gym_notify_enabled ?? 1))) return;

  const tz = normalizeTimeZone(client.timezone);
  const parts = getZonedParts(tz);
  if (parts.hour !== MEMBERSHIP_ALERT_HOUR) return;
  if (parts.minute >= WORKOUT_WINDOW_MINUTES) return;

  const daysRemaining =
    client.gym_days_remaining == null ? null : Number(client.gym_days_remaining);
  if (daysRemaining == null || !Number.isFinite(daysRemaining)) return;
  if (![7, 3, 1, 0].includes(daysRemaining)) return;

  const claimed = await dedupeService.claim(
    client.client_id,
    `gym_membership:${daysRemaining}:${parts.dateStr}`,
  );
  if (!claimed) return;

  const gymLabel = (client.gym_name && String(client.gym_name).trim())
    || 'tu gym';

  if (daysRemaining === 0) {
    await notificationService.createNotification({
      userId: client.client_id,
      title: 'Tu membresía del gym vence hoy',
      message: `La membresía de ${gymLabel} vence hoy. Renueva para no quedarte fuera.`,
      type: 'gym_membership_expired',
      entityType: 'gym_membership',
      entityId: client.client_id,
      actionUrl: '/client/profile',
    });
    return;
  }

  await notificationService.createNotification({
    userId: client.client_id,
    title: `Membresía del gym: ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`,
    message: `Tu membresía de ${gymLabel} vence en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}.`,
    type: 'gym_membership_expiring',
    entityType: 'gym_membership',
    entityId: client.client_id,
    actionUrl: '/client/profile',
  });
}

async function processStreakAtRisk(client) {
  const streak = Number(client.current_streak || 0);
  if (!(streak > 0)) return;

  const tz = normalizeTimeZone(client.timezone);
  const parts = getZonedParts(tz);
  if (parts.hour !== STREAK_ALERT_HOUR) return;
  if (parts.minute >= WORKOUT_WINDOW_MINUTES) return;

  const yesterday = addDaysToDateStr(parts.dateStr, -1);
  const trainedYesterday = await hasCompletedAnyWorkoutOnLocalDate(
    client.client_id,
    yesterday,
    tz,
  );
  if (trainedYesterday) return;

  const claimed = await dedupeService.claim(
    client.client_id,
    `streak_at_risk:${parts.dateStr}`,
  );
  if (!claimed) return;

  await notificationService.createNotification({
    userId: client.client_id,
    title: 'Tu racha está en riesgo — entrena hoy',
    message: `Llevas ${streak} ${streak === 1 ? 'día' : 'días'} de racha. Entrena hoy para no perderla.`,
    type: 'streak_at_risk',
    entityType: 'streak',
    entityId: client.client_id,
    actionUrl: '/client/progress',
  });
}

/**
 * Feature 083 — digest semanal por email al cliente (lunes ~09:00 TZ).
 */
async function processWeeklyClientDigest(client) {
  if (!isSmtpConfigured()) return;
  const email = String(client.email || '').trim();
  if (!email || !email.includes('@')) return;

  const tz = normalizeTimeZone(client.timezone);
  const parts = getZonedParts(tz);
  if (parts.weekdayEs !== WEEKLY_DIGEST_WEEKDAY) return;
  if (parts.hour !== WEEKLY_DIGEST_HOUR) return;
  if (parts.minute >= WORKOUT_WINDOW_MINUTES) return;

  const weekKey = parts.dateStr;
  const claimed = await dedupeService.claim(
    client.client_id,
    `weekly_client_digest:${weekKey}`,
  );
  if (!claimed) return;

  const weekStart = addDaysToDateStr(parts.dateStr, -7);
  const [[workoutRow]] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM workout_sessions
     WHERE client_id = ?
       AND status = 'completed'
       AND COALESCE(finished_at, created_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY)`,
    [client.client_id],
  );

  // Count workouts in last 7 local days (approx via finished timestamps + TZ filter)
  const [sessionRows] = await db.query(
    `SELECT finished_at, created_at
     FROM workout_sessions
     WHERE client_id = ?
       AND status = 'completed'
       AND COALESCE(finished_at, created_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY)`,
    [client.client_id],
  );
  let workoutsWeek = 0;
  for (const row of sessionRows) {
    const key = toZonedDateStr(row.finished_at || row.created_at, tz);
    if (key >= weekStart && key < parts.dateStr) workoutsWeek += 1;
  }
  if (!workoutsWeek && workoutRow) {
    workoutsWeek = Math.min(Number(workoutRow.cnt) || 0, 7);
  }

  const [[checkinRow]] = await db.query(
    `SELECT created_at
     FROM weekly_checkins
     WHERE client_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [client.client_id],
  );
  let checkinDue = true;
  if (checkinRow?.created_at) {
    const lastKey = toZonedDateStr(checkinRow.created_at, tz);
    const anchor = new Date(`${parts.dateStr}T12:00:00.000Z`);
    const lastNoon = new Date(`${lastKey}T12:00:00.000Z`);
    const diffDays = Math.floor((anchor - lastNoon) / (24 * 60 * 60 * 1000));
    checkinDue = diffDays >= 7;
  }

  const streak = Number(client.current_streak) || 0;
  const weekGoal = Number(client.week_goal) || 3;
  const daysRemaining = client.days_remaining == null
    ? null
    : Number(client.days_remaining);
  const name = String(client.nombre || 'athlete').split(/\s+/)[0];

  const lines = [
    `Hola ${name},`,
    '',
    `Resumen de tu semana en Trainfit:`,
    `• Entrenamientos (7 días): ${workoutsWeek}`,
    `• Racha actual: ${streak} día${streak === 1 ? '' : 's'} · Meta semanal ${weekGoal}`,
    checkinDue ? '• Check-in semanal pendiente' : '• Check-in al día',
  ];
  if (daysRemaining != null && Number.isFinite(daysRemaining) && daysRemaining <= 7) {
    lines.push(
      daysRemaining < 0
        ? '• Membresía vencida — renueva con tu entrenador'
        : `• Membresía: ${daysRemaining} día${daysRemaining === 1 ? '' : 's'} restantes`,
    );
  }
  lines.push('', `Abre la app: ${APP_PUBLIC_URL}/dashboard`, '', '— Equipo Trainfit');

  const text = lines.join('\n');
  const html = `<p>Hola <strong>${name}</strong>,</p>
<p>Resumen de tu semana en Trainfit:</p>
<ul>
  <li>Entrenamientos (7 días): <strong>${workoutsWeek}</strong></li>
  <li>Racha actual: <strong>${streak}</strong> · Meta semanal ${weekGoal}</li>
  <li>${checkinDue ? 'Check-in semanal pendiente' : 'Check-in al día'}</li>
  ${
    daysRemaining != null && Number.isFinite(daysRemaining) && daysRemaining <= 7
      ? `<li>${daysRemaining < 0 ? 'Membresía vencida' : `Membresía: ${daysRemaining} días restantes`}</li>`
      : ''
  }
</ul>
<p><a href="${APP_PUBLIC_URL}/dashboard">Abrir Trainfit</a></p>
<p>— Equipo Trainfit</p>`;

  try {
    await sendMail({
      to: email,
      subject: 'Tu semana en Trainfit',
      text,
      html,
    });
  } catch (error) {
    console.error(
      `[notification-jobs] weekly digest client ${client.client_id}:`,
      error.message,
    );
  }
}

/**
 * Periodic tick: workout reminders, membership alerts, streak_at_risk, weekly digest.
 * Never throws to the caller for per-client failures.
 */
async function runTick() {
  let clients;
  try {
    clients = await listClientsForJobs();
  } catch (error) {
    console.error('[notification-jobs] listClientsForJobs:', error.message);
    return { processed: 0, error: error.message };
  }

  let processed = 0;
  for (const client of clients) {
    try {
      if (client.timezone == null || client.workout_reminder_hour == null) {
        await notificationSettingsService.ensureDefaults(client.client_id);
      }

      await processWorkoutReminder(client);
      await processMembershipAlerts(client);
      await processGymMembershipAlert(client);
      await processStreakAtRisk(client);
      await processWeeklyClientDigest(client);
      processed += 1;
    } catch (error) {
      console.error(
        `[notification-jobs] client ${client.client_id}:`,
        error.message,
      );
    }
  }

  return { processed };
}

module.exports = {
  runTick,
  hasCompletedRoutineOnLocalDate,
  hasCompletedAnyWorkoutOnLocalDate,
  processWeeklyClientDigest,
};
