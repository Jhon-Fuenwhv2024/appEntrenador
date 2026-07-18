const db = require('../../config/db');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/** Lazy require — evita ciclo clients ↔ memberships (module.exports replace). */
function getMembershipsService() {
  return require('../memberships/memberships.service');
}

function monthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthLabel(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const raw = date.toLocaleDateString('es-ES', { month: 'short' });
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace('.', '');
}

function buildLastMonths(count) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(date));
  }
  return months;
}

/** Feature 035 — activo = ≥1 sesión completed en esta ventana (días). */
const RETENTION_WINDOW_DAYS = 14;

function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Lunes de la semana local (WEEKDAY MySQL: 0 = lunes). */
function startOfLocalWeek(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=dom … 6=sáb
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  return d;
}

function buildWeekDayKeys(weekStart) {
  const keys = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    keys.push(toLocalDateString(day));
  }
  return keys;
}

function formatDayField(value) {
  if (value == null) return null;
  if (value instanceof Date) return toLocalDateString(value);
  const raw = String(value);
  return raw.slice(0, 10);
}

async function getClientsForTrainer(trainerId) {
  const [clients] = await db.query(
    `SELECT
       u.id,
       u.nombre,
       u.username,
       COUNT(r.id) AS routines_count,
       cm.status AS membership_status,
       cm.period_start AS membership_period_start,
       cm.period_end AS membership_period_end,
       cm.block_on_unpaid AS membership_block_on_unpaid,
       DATEDIFF(cm.period_end, CURDATE()) AS membership_days_remaining
     FROM usuarios u
     LEFT JOIN rutinas r ON r.alumno_id = u.id
     LEFT JOIN client_memberships cm ON cm.client_id = u.id
     WHERE u.rol = 'client' AND u.trainer_id = ?
     GROUP BY
       u.id,
       u.nombre,
       u.username,
       cm.status,
       cm.period_start,
       cm.period_end,
       cm.block_on_unpaid
     ORDER BY u.nombre ASC`,
    [trainerId],
  );

  const membershipsService = getMembershipsService();

  return clients.map((client) => {
    const routinesCount = Number(client.routines_count) || 0;
    const hasMembership = client.membership_status != null;

    let membership = null;
    if (hasMembership) {
      membership = membershipsService.mapMembershipRow({
        client_id: client.id,
        status: client.membership_status,
        period_start: client.membership_period_start,
        period_end: client.membership_period_end,
        block_on_unpaid: client.membership_block_on_unpaid,
        updated_by: null,
        updated_at: null,
        days_remaining: client.membership_days_remaining,
      }, { includeNotes: false });
    }

    return {
      id: client.id,
      nombre: client.nombre,
      username: client.username,
      routines_count: routinesCount,
      status: routinesCount > 0 ? 'Activo' : 'Sin plan',
      membership,
    };
  });
}

async function getClientOwnedByTrainer(clientId, trainerId) {
  const [rows] = await db.query(
    `SELECT id, nombre, username, trainer_id
     FROM usuarios
     WHERE id = ? AND rol = 'client' AND trainer_id = ?`,
    [clientId, trainerId],
  );

  if (rows.length === 0) {
    throw createHttpError('Cliente no encontrado o no pertenece a tu cuenta.', 404);
  }

  return rows[0];
}

async function getDashboardStats(trainerId) {
  const weekStart = startOfLocalWeek();
  const weekStartStr = toLocalDateString(weekStart);
  const nextWeekStart = new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate() + 7,
  );
  const nextWeekStartStr = toLocalDateString(nextWeekStart);
  const prevWeekStart = new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate() - 7,
  );
  const prevWeekStartStr = toLocalDateString(prevWeekStart);

  const [[totals]] = await db.query(
    `SELECT
       (SELECT COUNT(*)
        FROM usuarios
        WHERE rol = 'client' AND trainer_id = ?) AS clients_count,
       (SELECT COUNT(*)
        FROM rutinas r
        INNER JOIN usuarios u ON u.id = r.alumno_id
        WHERE u.rol = 'client' AND u.trainer_id = ?) AS routines_count,
       (SELECT COUNT(*)
        FROM workout_sessions ws
        INNER JOIN usuarios u ON u.id = ws.client_id
        WHERE u.rol = 'client'
          AND u.trainer_id = ?
          AND ws.status = 'completed'
          AND YEAR(ws.finished_at) = YEAR(CURRENT_DATE())
          AND MONTH(ws.finished_at) = MONTH(CURRENT_DATE())) AS sessions_this_month,
       (SELECT COUNT(*)
        FROM usuarios
        WHERE rol = 'client'
          AND trainer_id = ?
          AND YEAR(created_at) = YEAR(CURRENT_DATE())
          AND MONTH(created_at) = MONTH(CURRENT_DATE())) AS clients_this_month,
       (SELECT COUNT(*)
        FROM usuarios
        WHERE rol = 'client'
          AND trainer_id = ?
          AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
          AND MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))) AS clients_last_month,
       (SELECT COUNT(DISTINCT u.id)
        FROM usuarios u
        INNER JOIN workout_sessions ws ON ws.client_id = u.id
        WHERE u.rol = 'client'
          AND u.trainer_id = ?
          AND ws.status = 'completed'
          AND ws.finished_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) AS active_clients,
       (SELECT COUNT(*)
        FROM weekly_checkins wc
        INNER JOIN usuarios u ON u.id = wc.client_id
        WHERE u.rol = 'client'
          AND u.trainer_id = ?
          AND wc.reviewed_at IS NULL) AS unreviewed_checkins,
       (SELECT COUNT(*)
        FROM usuarios u
        LEFT JOIN nutrition_targets nt ON nt.client_id = u.id
        WHERE u.rol = 'client'
          AND u.trainer_id = ?
          AND nt.client_id IS NULL) AS diets_unassigned,
       (SELECT COUNT(*)
        FROM workout_sessions ws
        INNER JOIN usuarios u ON u.id = ws.client_id
        WHERE u.rol = 'client'
          AND u.trainer_id = ?
          AND ws.status = 'completed'
          AND ws.finished_at >= ?
          AND ws.finished_at < ?) AS sessions_this_week,
       (SELECT COUNT(*)
        FROM workout_sessions ws
        INNER JOIN usuarios u ON u.id = ws.client_id
        WHERE u.rol = 'client'
          AND u.trainer_id = ?
          AND ws.status = 'completed'
          AND ws.finished_at >= ?
          AND ws.finished_at < ?) AS sessions_prev_week`,
    [
      trainerId,
      trainerId,
      trainerId,
      trainerId,
      trainerId,
      trainerId,
      RETENTION_WINDOW_DAYS,
      trainerId,
      trainerId,
      trainerId,
      weekStartStr,
      nextWeekStartStr,
      trainerId,
      prevWeekStartStr,
      weekStartStr,
    ],
  );

  const clientsCount = Number(totals.clients_count) || 0;
  const routinesCount = Number(totals.routines_count) || 0;
  const sessionsThisMonth = Number(totals.sessions_this_month) || 0;
  const clientsThisMonth = Number(totals.clients_this_month) || 0;
  const clientsLastMonth = Number(totals.clients_last_month) || 0;
  const activeClients = Number(totals.active_clients) || 0;
  const inactiveClients = Math.max(0, clientsCount - activeClients);
  const unreviewedCheckins = Number(totals.unreviewed_checkins) || 0;
  const dietsUnassigned = Number(totals.diets_unassigned) || 0;
  const sessionsThisWeek = Number(totals.sessions_this_week) || 0;
  const sessionsPrevWeek = Number(totals.sessions_prev_week) || 0;

  let growthPercent = 0;
  if (clientsLastMonth === 0) {
    growthPercent = clientsThisMonth > 0 ? 100 : 0;
  } else {
    growthPercent = Math.round(((clientsThisMonth - clientsLastMonth) / clientsLastMonth) * 100);
  }

  const ratePercent = clientsCount > 0
    ? Math.round((activeClients / clientsCount) * 100)
    : 0;

  let vsPreviousPercent = 0;
  if (sessionsPrevWeek === 0) {
    vsPreviousPercent = sessionsThisWeek > 0 ? 100 : 0;
  } else {
    vsPreviousPercent = Math.round(
      ((sessionsThisWeek - sessionsPrevWeek) / sessionsPrevWeek) * 100,
    );
  }

  const months = buildLastMonths(6);
  const rangeStart = `${months[0]}-01`;

  const [clientRows] = await db.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_key, COUNT(*) AS total
     FROM usuarios
     WHERE rol = 'client'
       AND trainer_id = ?
       AND created_at >= ?
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')`,
    [trainerId, rangeStart],
  );

  const [sessionRows] = await db.query(
    `SELECT DATE_FORMAT(ws.finished_at, '%Y-%m') AS month_key, COUNT(*) AS total
     FROM workout_sessions ws
     INNER JOIN usuarios u ON u.id = ws.client_id
     WHERE u.rol = 'client'
       AND u.trainer_id = ?
       AND ws.status = 'completed'
       AND ws.finished_at >= ?
     GROUP BY DATE_FORMAT(ws.finished_at, '%Y-%m')`,
    [trainerId, rangeStart],
  );

  const [weekDayRows] = await db.query(
    `SELECT DATE(ws.finished_at) AS day_key, COUNT(*) AS total
     FROM workout_sessions ws
     INNER JOIN usuarios u ON u.id = ws.client_id
     WHERE u.rol = 'client'
       AND u.trainer_id = ?
       AND ws.status = 'completed'
       AND ws.finished_at >= ?
       AND ws.finished_at < ?
     GROUP BY DATE(ws.finished_at)`,
    [trainerId, weekStartStr, nextWeekStartStr],
  );

  const clientsByMonth = Object.fromEntries(
    clientRows.map((row) => [row.month_key, Number(row.total) || 0]),
  );
  const sessionsByMonth = Object.fromEntries(
    sessionRows.map((row) => [row.month_key, Number(row.total) || 0]),
  );
  const sessionsByDay = Object.fromEntries(
    weekDayRows.map((row) => [formatDayField(row.day_key), Number(row.total) || 0]),
  );

  // Clients created before the window → baseline for cumulative series
  const [[beforeRow]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM usuarios
     WHERE rol = 'client'
       AND trainer_id = ?
       AND created_at < ?`,
    [trainerId, rangeStart],
  );
  let cumulativeClients = Number(beforeRow.total) || 0;

  const monthlyActivity = months.map((key) => {
    cumulativeClients += clientsByMonth[key] || 0;
    return {
      month: key,
      label: monthLabel(key),
      clients: cumulativeClients,
      sessions: sessionsByMonth[key] || 0,
    };
  });

  const byDay = buildWeekDayKeys(weekStart).map((date) => ({
    date,
    count: sessionsByDay[date] || 0,
  }));

  // Pagos / membresías de alumnos (Feature 040) — conteos set-based
  const [[paymentsRow]] = await db.query(
    `SELECT
       SUM(CASE WHEN cm.status = 'active' THEN 1 ELSE 0 END) AS active_count,
       SUM(CASE WHEN cm.status = 'owing' THEN 1 ELSE 0 END) AS owing_count,
       SUM(CASE WHEN cm.status = 'expired' THEN 1 ELSE 0 END) AS expired_count,
       SUM(CASE WHEN cm.client_id IS NULL THEN 1 ELSE 0 END) AS none_count,
       SUM(CASE
         WHEN cm.status = 'active'
           AND cm.period_end IS NOT NULL
           AND DATEDIFF(cm.period_end, CURDATE()) BETWEEN 0 AND 7
         THEN 1 ELSE 0 END) AS expiring_soon
     FROM usuarios u
     LEFT JOIN client_memberships cm ON cm.client_id = u.id
     WHERE u.rol = 'client' AND u.trainer_id = ?`,
    [trainerId],
  );

  const payments = {
    active: Number(paymentsRow?.active_count) || 0,
    owing: Number(paymentsRow?.owing_count) || 0,
    expired: Number(paymentsRow?.expired_count) || 0,
    none: Number(paymentsRow?.none_count) || 0,
    expiringSoon: Number(paymentsRow?.expiring_soon) || 0,
  };

  return {
    clientsCount,
    routinesCount,
    sessionsThisMonth,
    growthPercent,
    clientsThisMonth,
    clientsLastMonth,
    monthlyActivity,
    retention: {
      active: activeClients,
      inactive: inactiveClients,
      ratePercent,
      windowDays: RETENTION_WINDOW_DAYS,
    },
    pendingTasks: {
      unreviewedCheckins,
      dietsUnassigned,
      total: unreviewedCheckins + dietsUnassigned,
    },
    weekProgress: {
      sessionsCompleted: sessionsThisWeek,
      previousWeekSessions: sessionsPrevWeek,
      vsPreviousPercent,
      weekStart: weekStartStr,
      byDay,
    },
    payments,
  };
}

/**
 * Aggregated 360 overview for a client owned by the trainer.
 * Slots membership / consistencyScore / prsThisMonth stay null until features 040–042.
 */
async function getClientOverview(clientId, trainerId) {
  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw createHttpError('clientId inválido.', 400);
  }

  const client = await getClientOwnedByTrainer(clientId, trainerId);

  const [[profileRow]] = await db.query(
    `SELECT telefono, fecha_nacimiento, sexo, lesiones, objetivo, foto_url, ultimo_acceso
     FROM alumnos_info
     WHERE user_id = ?
     LIMIT 1`,
    [clientId],
  );

  const [[counts]] = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM rutinas WHERE alumno_id = ?) AS routines_count,
       (SELECT COUNT(*) FROM workout_sessions WHERE client_id = ?) AS sessions_count,
       (SELECT COUNT(*) FROM weekly_checkins WHERE client_id = ?) AS checkins_count`,
    [clientId, clientId, clientId],
  );

  const [sessionRows] = await db.query(
    `SELECT id, client_id, routine_id, routine_name, started_at, finished_at, status, created_at
     FROM workout_sessions
     WHERE client_id = ?
     ORDER BY COALESCE(finished_at, started_at, created_at) DESC, id DESC
     LIMIT 1`,
    [clientId],
  );

  const [checkinRows] = await db.query(
    `SELECT id, client_id, created_at, sleep_quality, stress_level, diet_adherence, notes
     FROM weekly_checkins
     WHERE client_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [clientId],
  );

  const [nutritionRows] = await db.query(
    `SELECT id, client_id, trainer_id, calories, protein_g, carbs_g, fats_g, created_at, updated_at
     FROM nutrition_targets
     WHERE client_id = ?
     LIMIT 1`,
    [clientId],
  );

  const membershipsService = getMembershipsService();
  const membershipRow = await membershipsService.getByClientId(clientId);
  const membership = membershipsService.summarizeMembership(membershipRow);

  let consistencyScore = null;
  let prsThisMonth = null;
  try {
    const consistencyService = require('../consistency/consistency.service');
    const consistency = await consistencyService.buildConsistencyPayload(clientId);
    consistencyScore = {
      value: consistency.score,
      current_streak: consistency.current_streak,
      best_streak: consistency.best_streak,
      week_goal: consistency.week_goal,
      workouts_this_week: consistency.workouts_this_week,
    };
  } catch (error) {
    console.error('Error cargando consistencia en overview 360:', error.message);
  }
  try {
    const personalRecordsService = require('../personal-records/personal-records.service');
    prsThisMonth = {
      count: await personalRecordsService.countPrsThisMonth(clientId),
    };
  } catch (error) {
    console.error('Error cargando PRs en overview 360:', error.message);
  }

  const DEFAULT_AVATAR_MARKERS = new Set(['', 'default_avatar.png', 'null', 'undefined']);
  const rawFoto = profileRow?.foto_url;
  let fotoUrl = null;
  if (rawFoto != null) {
    const trimmed = String(rawFoto).trim();
    if (trimmed && !DEFAULT_AVATAR_MARKERS.has(trimmed)) {
      fotoUrl = trimmed;
    }
  }

  return {
    client: {
      id: client.id,
      nombre: client.nombre,
      username: client.username,
    },
    profile: {
      user_id: client.id,
      nombre: client.nombre,
      username: client.username,
      telefono: profileRow?.telefono ?? null,
      fecha_nacimiento: profileRow?.fecha_nacimiento
        ? String(profileRow.fecha_nacimiento).slice(0, 10)
        : null,
      sexo: profileRow?.sexo ?? null,
      lesiones: profileRow?.lesiones ?? null,
      objetivo: profileRow?.objetivo ?? null,
      foto_url: fotoUrl,
      ultimo_acceso: profileRow?.ultimo_acceso ?? null,
    },
    counts: {
      routines: Number(counts.routines_count) || 0,
      sessions: Number(counts.sessions_count) || 0,
      checkins: Number(counts.checkins_count) || 0,
    },
    lastSession: sessionRows[0] || null,
    lastCheckin: checkinRows[0] || null,
    nutritionTargets: nutritionRows[0] || null,
    membership,
    consistencyScore,
    prsThisMonth,
  };
}

module.exports = {
  getClientsForTrainer,
  getClientOwnedByTrainer,
  getDashboardStats,
  getClientOverview,
  createHttpError,
};
