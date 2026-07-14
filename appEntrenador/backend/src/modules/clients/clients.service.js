const db = require('../../config/db');

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
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

async function getClientsForTrainer(trainerId) {
  const [clients] = await db.query(
    `SELECT
       u.id,
       u.nombre,
       u.username,
       COUNT(r.id) AS routines_count
     FROM usuarios u
     LEFT JOIN rutinas r ON r.alumno_id = u.id
     WHERE u.rol = 'client' AND u.trainer_id = ?
     GROUP BY u.id, u.nombre, u.username
     ORDER BY u.nombre ASC`,
    [trainerId],
  );

  return clients.map((client) => {
    const routinesCount = Number(client.routines_count) || 0;
    return {
      id: client.id,
      nombre: client.nombre,
      username: client.username,
      routines_count: routinesCount,
      status: routinesCount > 0 ? 'Activo' : 'Sin plan',
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
          AND MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))) AS clients_last_month`,
    [trainerId, trainerId, trainerId, trainerId, trainerId],
  );

  const clientsCount = Number(totals.clients_count) || 0;
  const routinesCount = Number(totals.routines_count) || 0;
  const sessionsThisMonth = Number(totals.sessions_this_month) || 0;
  const clientsThisMonth = Number(totals.clients_this_month) || 0;
  const clientsLastMonth = Number(totals.clients_last_month) || 0;

  let growthPercent = 0;
  if (clientsLastMonth === 0) {
    growthPercent = clientsThisMonth > 0 ? 100 : 0;
  } else {
    growthPercent = Math.round(((clientsThisMonth - clientsLastMonth) / clientsLastMonth) * 100);
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

  const clientsByMonth = Object.fromEntries(
    clientRows.map((row) => [row.month_key, Number(row.total) || 0]),
  );
  const sessionsByMonth = Object.fromEntries(
    sessionRows.map((row) => [row.month_key, Number(row.total) || 0]),
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

  return {
    clientsCount,
    routinesCount,
    sessionsThisMonth,
    growthPercent,
    clientsThisMonth,
    clientsLastMonth,
    monthlyActivity,
  };
}

module.exports = {
  getClientsForTrainer,
  getClientOwnedByTrainer,
  getDashboardStats,
  createHttpError,
};
