/**
 * Poblado idempotente de rutinas, nutrición y Client 360 para clientes existentes.
 * No crea usuarios. No toca Camila (5) ni smoke clients.
 *
 * Uso (desde backend/, mismas DB_* que Render/TiDB):
 *   node scripts/seedExistingClientsDemo.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

function parseBool(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function dateOnly(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function truncate(str, max) {
  const s = String(str || '');
  return s.length <= max ? s : s.slice(0, max);
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Catálogo exercises.id con GIF local (verificado en TiDB). */
const EX = {
  squat: { id: 72, name: 'Sentadilla Profunda con Barra' },
  hipThrust: { id: 73, name: 'Hip Thrust con Barra' },
  lunge: { id: 87, name: 'Sentadilla en zancada con Barra' },
  bench: { id: 68, name: 'Press Banca con Barra' },
  incline: { id: 77, name: 'Press Inclinado con Barra' },
  row: { id: 104, name: 'Remo en Pronación con Barra' },
  dbRow: { id: 109, name: 'Remo Neutro con Mancuernas' },
  pullup: { id: 184, name: 'Dominada en Supinación' },
  arnold: { id: 50, name: 'Press Arnold Abierto con Mancuernas' },
  military: { id: 38, name: 'Press Militar en Polea' },
  curl: { id: 69, name: 'Curl en Supinación con Barra' },
  scott: { id: 147, name: 'Curl en Banco Scott en Supinación con Polea' },
  french: { id: 145, name: 'Press Francés con Polea' },
  bandFrench: { id: 65, name: 'Press Francés con Bandas' },
  crunch: { id: 123, name: 'Crunch Inferior con Rodillas Flexionadas' },
  hipRaise: { id: 103, name: 'Elevación de Cadera con piernas flexionadas' },
};

const WEEK_SPLIT = [
  {
    dia: 'Lunes',
    nombre: 'Pierna',
    items: [
      { ex: EX.squat, series: 4, reps: 8, peso: 40 },
      { ex: EX.hipThrust, series: 4, reps: 10, peso: 50 },
      { ex: EX.lunge, series: 3, reps: 10, peso: 20 },
      { ex: EX.hipRaise, series: 3, reps: 15, peso: 0 },
    ],
  },
  {
    dia: 'Martes',
    nombre: 'Pecho',
    items: [
      { ex: EX.bench, series: 4, reps: 8, peso: 35 },
      { ex: EX.incline, series: 3, reps: 10, peso: 30 },
      { ex: EX.french, series: 3, reps: 12, peso: 20 },
      { ex: EX.crunch, series: 3, reps: 15, peso: 0 },
    ],
  },
  {
    dia: 'Miércoles',
    nombre: 'Espalda - Bíceps',
    items: [
      { ex: EX.pullup, series: 3, reps: 6, peso: 0 },
      { ex: EX.row, series: 4, reps: 8, peso: 40 },
      { ex: EX.dbRow, series: 3, reps: 10, peso: 16 },
      { ex: EX.curl, series: 3, reps: 12, peso: 15 },
      { ex: EX.scott, series: 3, reps: 10, peso: 20 },
    ],
  },
  {
    dia: 'Jueves',
    nombre: 'Hombro - Tríceps',
    items: [
      { ex: EX.arnold, series: 4, reps: 10, peso: 12 },
      { ex: EX.military, series: 3, reps: 10, peso: 25 },
      { ex: EX.bandFrench, series: 3, reps: 12, peso: 0 },
      { ex: EX.french, series: 3, reps: 12, peso: 20 },
    ],
  },
  {
    dia: 'Viernes',
    nombre: 'Full body',
    items: [
      { ex: EX.squat, series: 3, reps: 10, peso: 35 },
      { ex: EX.bench, series: 3, reps: 10, peso: 30 },
      { ex: EX.row, series: 3, reps: 10, peso: 35 },
      { ex: EX.crunch, series: 3, reps: 20, peso: 0 },
    ],
  },
];

const CLIENT_PROFILES = {
  4: {
    mode: 'gaps',
    info: {
      telefono: '3001112233',
      fecha_nacimiento: '1998-04-12',
      sexo: 'Masculino',
      objetivo: 'Hipertrofia',
    },
    nutrition: { calories: 2200, protein_g: 160, carbs_g: 220, fats_g: 70 },
    dietTitle: 'Plan mantenimiento - Lucas',
    weight: 78,
    height: 178,
    sexHint: 'M',
  },
  8: {
    mode: 'full',
    info: {
      telefono: '3105556677',
      fecha_nacimiento: '1999-08-21',
      sexo: 'Femenino',
      objetivo: 'Recomposición',
    },
    nutrition: { calories: 1900, protein_g: 130, carbs_g: 180, fats_g: 60 },
    dietTitle: 'Plan recomposición - Daniela',
    weight: 62,
    height: 165,
    sexHint: 'F',
  },
  9: {
    mode: 'full',
    info: {
      telefono: '3124445566',
      fecha_nacimiento: '1995-01-30',
      sexo: 'Masculino',
      objetivo: 'Fuerza',
    },
    nutrition: { calories: 2400, protein_g: 180, carbs_g: 250, fats_g: 75 },
    dietTitle: 'Plan fuerza - Chavo',
    weight: 85,
    height: 180,
    sexHint: 'M',
  },
  11: {
    mode: 'full',
    info: {
      telefono: '3157778899',
      fecha_nacimiento: '2001-11-05',
      sexo: 'Femenino',
      objetivo: 'Salud y tono',
    },
    nutrition: { calories: 1800, protein_g: 120, carbs_g: 170, fats_g: 55 },
    dietTitle: 'Plan tono - Dayana',
    weight: 58,
    height: 162,
    sexHint: 'F',
  },
  30002: {
    mode: 'full',
    info: {
      telefono: '3209990011',
      fecha_nacimiento: '1997-06-18',
      sexo: 'Femenino',
      objetivo: 'Pérdida de grasa',
    },
    nutrition: { calories: 1700, protein_g: 125, carbs_g: 150, fats_g: 50 },
    dietTitle: 'Plan déficit - Sofía',
    weight: 64,
    height: 168,
    sexHint: 'F',
  },
};

function food(name, quantity, unit, calories, protein_g, carbs_g, fats_g) {
  return { food_name: name, quantity, unit, calories, protein_g, carbs_g, fats_g };
}

function mealTemplate(weekIndex, dayName) {
  const w = weekIndex === 1 ? 1 : 1.05;
  const scale = (n) => Math.round(n * w);
  const variant = DAYS.indexOf(dayName) % 2 === 0;

  const breakfast = variant
    ? [
        food('Avena cocida', 60, 'g', scale(220), 8, 38, 4),
        food('Huevo entero', 2, 'unidad', scale(140), 12, 1, 10),
        food('Plátano', 1, 'unidad', scale(90), 1, 23, 0),
      ]
    : [
        food('Yogur griego', 150, 'g', scale(130), 15, 8, 4),
        food('Granola', 30, 'g', scale(120), 3, 18, 4),
        food('Fresas', 100, 'g', scale(35), 1, 8, 0),
      ];

  const lunch = variant
    ? [
        food('Pechuga de pollo', 150, 'g', scale(248), 46, 0, 5),
        food('Arroz blanco', 120, 'g', scale(156), 3, 34, 0),
        food('Brócoli al vapor', 100, 'g', scale(35), 3, 7, 0),
        food('Aceite de oliva', 5, 'ml', scale(45), 0, 0, 5),
      ]
    : [
        food('Carne magra', 140, 'g', scale(230), 35, 0, 10),
        food('Papa cocida', 180, 'g', scale(150), 4, 34, 0),
        food('Ensalada mixta', 120, 'g', scale(40), 2, 6, 1),
      ];

  const dinner = variant
    ? [
        food('Salmón', 140, 'g', scale(280), 28, 0, 18),
        food('Quinoa', 80, 'g', scale(120), 4, 21, 2),
        food('Espárragos', 100, 'g', scale(25), 2, 4, 0),
      ]
    : [
        food('Tilapia', 160, 'g', scale(170), 34, 0, 3),
        food('Batata', 150, 'g', scale(130), 2, 30, 0),
        food('Zanahoria', 80, 'g', scale(30), 1, 7, 0),
      ];

  return [
    { name: 'Desayuno', time_hint: '08:00', items: breakfast },
    { name: 'Almuerzo', time_hint: '13:00', items: lunch },
    { name: 'Cena', time_hint: '20:00', items: dinner },
  ];
}

function sumMacros(meals) {
  let calories = 0;
  let protein_g = 0;
  let carbs_g = 0;
  let fats_g = 0;
  for (const meal of meals) {
    for (const item of meal.items) {
      calories += Number(item.calories) || 0;
      protein_g += Number(item.protein_g) || 0;
      carbs_g += Number(item.carbs_g) || 0;
      fats_g += Number(item.fats_g) || 0;
    }
  }
  return { calories, protein_g, carbs_g, fats_g };
}

async function ensureAlumnosInfo(conn, clientId, info) {
  const [rows] = await conn.query(
    'SELECT id FROM alumnos_info WHERE user_id = ? LIMIT 1',
    [clientId],
  );
  if (rows.length) return { created: false };
  await conn.query(
    `INSERT INTO alumnos_info (user_id, telefono, fecha_nacimiento, sexo, objetivo)
     VALUES (?, ?, ?, ?, ?)`,
    [clientId, info.telefono, info.fecha_nacimiento, info.sexo, info.objetivo],
  );
  return { created: true };
}

async function ensureMembership(conn, clientId, trainerId) {
  const [rows] = await conn.query(
    'SELECT id FROM client_memberships WHERE client_id = ? LIMIT 1',
    [clientId],
  );
  if (rows.length) return { created: false };
  const start = dateOnly(daysAgo(5));
  const end = dateOnly(daysAgo(-25));
  await conn.query(
    `INSERT INTO client_memberships
      (client_id, status, period_start, period_end, notes, block_on_unpaid, updated_by)
     VALUES (?, 'active', ?, ?, ?, FALSE, ?)`,
    [clientId, start, end, 'Membresía demo seed', trainerId],
  );
  return { created: true };
}

async function ensureWeekRoutines(conn, clientId) {
  const [existing] = await conn.query(
    'SELECT id, dia_semana, nombre_rutina FROM rutinas WHERE alumno_id = ?',
    [clientId],
  );
  const byDay = new Set(existing.map((r) => r.dia_semana));
  let createdRoutines = 0;
  let createdExercises = 0;
  const routineIds = [...existing];

  for (const day of WEEK_SPLIT) {
    if (byDay.has(day.dia)) continue;
    const [result] = await conn.query(
      `INSERT INTO rutinas (alumno_id, dia_semana, nombre_rutina) VALUES (?, ?, ?)`,
      [clientId, day.dia, day.nombre],
    );
    const routineId = result.insertId;
    createdRoutines += 1;
    routineIds.push({ id: routineId, dia_semana: day.dia, nombre_rutina: day.nombre });

    for (const item of day.items) {
      await conn.query(
        `INSERT INTO ejercicios
          (rutina_id, nombre, exercise_id, series, repeticiones, indicaciones, peso, rest_time_seconds)
         VALUES (?, ?, ?, ?, ?, ?, ?, 90)`,
        [
          routineId,
          truncate(item.ex.name, 100),
          item.ex.id,
          item.series,
          item.reps,
          null,
          item.peso,
        ],
      );
      createdExercises += 1;
    }
  }

  return { createdRoutines, createdExercises, routineIds };
}

async function ensureNutrition(conn, clientId, trainerId, nutrition) {
  const [rows] = await conn.query(
    'SELECT id FROM nutrition_targets WHERE client_id = ? LIMIT 1',
    [clientId],
  );
  if (rows.length) return { created: false };
  await conn.query(
    `INSERT INTO nutrition_targets (client_id, trainer_id, calories, protein_g, carbs_g, fats_g)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      clientId,
      trainerId,
      nutrition.calories,
      nutrition.protein_g,
      nutrition.carbs_g,
      nutrition.fats_g,
    ],
  );
  return { created: true };
}

async function ensureDietPlan(conn, clientId, trainerId, title, nutrition) {
  const [existing] = await conn.query(
    `SELECT id FROM diet_plans WHERE client_id = ? AND is_active = 1 LIMIT 1`,
    [clientId],
  );
  if (existing.length) return { created: false, planId: existing[0].id };

  const cycleStart = dateOnly(daysAgo(3));
  const [planResult] = await conn.query(
    `INSERT INTO diet_plans
      (trainer_id, client_id, title, notes, calories, protein_g, carbs_g, fats_g,
       is_active, cycle_length_weeks, cycle_start_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 2, ?)`,
    [
      trainerId,
      clientId,
      truncate(title, 150),
      'Plan demo seed (ciclo 2 semanas)',
      nutrition.calories,
      nutrition.protein_g,
      nutrition.carbs_g,
      nutrition.fats_g,
      cycleStart,
    ],
  );
  const planId = planResult.insertId;

  let dayTotals = { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 };
  let dayCount = 0;

  for (let week = 1; week <= 2; week += 1) {
    for (const dayName of DAYS) {
      const meals = mealTemplate(week, dayName);
      const macros = sumMacros(meals);
      dayTotals.calories += macros.calories;
      dayTotals.protein_g += macros.protein_g;
      dayTotals.carbs_g += macros.carbs_g;
      dayTotals.fats_g += macros.fats_g;
      dayCount += 1;

      const [dayResult] = await conn.query(
        `INSERT INTO diet_plan_days
          (diet_plan_id, week_index, dia_semana, notes, calories, protein_g, carbs_g, fats_g)
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?)`,
        [
          planId,
          week,
          dayName,
          macros.calories,
          macros.protein_g,
          macros.carbs_g,
          macros.fats_g,
        ],
      );
      const dayId = dayResult.insertId;

      for (let mi = 0; mi < meals.length; mi += 1) {
        const meal = meals[mi];
        const [mealResult] = await conn.query(
          `INSERT INTO diet_meals (diet_day_id, name, sort_order, time_hint)
           VALUES (?, ?, ?, ?)`,
          [dayId, meal.name, mi, meal.time_hint],
        );
        const mealId = mealResult.insertId;
        for (let ii = 0; ii < meal.items.length; ii += 1) {
          const item = meal.items[ii];
          await conn.query(
            `INSERT INTO diet_items
              (diet_meal_id, food_name, quantity, unit, calories, protein_g, carbs_g, fats_g, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              mealId,
              truncate(item.food_name, 150),
              item.quantity,
              item.unit,
              item.calories,
              item.protein_g,
              item.carbs_g,
              item.fats_g,
              ii,
            ],
          );
        }
      }
    }
  }

  if (dayCount > 0) {
    await conn.query(
      `UPDATE diet_plans
       SET calories = ?, protein_g = ?, carbs_g = ?, fats_g = ?
       WHERE id = ?`,
      [
        Math.round(dayTotals.calories / dayCount),
        Math.round(dayTotals.protein_g / dayCount),
        Math.round(dayTotals.carbs_g / dayCount),
        Math.round(dayTotals.fats_g / dayCount),
        planId,
      ],
    );
  }

  return { created: true, planId };
}

async function ensureHabits(conn, clientId, trainerId) {
  const titles = ['Beber 2L de agua', 'Dormir 7+ horas', '10k pasos'];
  const [existing] = await conn.query(
    'SELECT id, title FROM habits WHERE client_id = ?',
    [clientId],
  );
  const have = new Set(existing.map((h) => h.title));
  const habitIds = [...existing.map((h) => h.id)];
  let created = 0;

  for (const title of titles) {
    if (have.has(title)) continue;
    const [result] = await conn.query(
      `INSERT INTO habits (client_id, trainer_id, title) VALUES (?, ?, ?)`,
      [clientId, trainerId, title],
    );
    habitIds.push(result.insertId);
    created += 1;
  }

  let logsCreated = 0;
  for (const habitId of habitIds) {
    for (let i = 0; i < 10; i += 1) {
      if (i % 3 === 0) continue;
      const logged = dateOnly(daysAgo(i));
      try {
        await conn.query(
          `INSERT INTO habit_logs (habit_id, logged_date) VALUES (?, ?)`,
          [habitId, logged],
        );
        logsCreated += 1;
      } catch (err) {
        if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) continue;
        throw err;
      }
    }
  }

  return { created, logsCreated };
}

async function ensureBodyLogs(conn, clientId, trainerId, profile) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS c FROM body_composition_logs WHERE client_id = ?',
    [clientId],
  );
  const count = Number(rows[0].c) || 0;
  if (count >= 2) return { created: 0 };

  const points = [
    { ago: 28, delta: 1.2 },
    { ago: 14, delta: 0.6 },
    { ago: 3, delta: 0 },
  ].slice(0, 3 - count);

  let created = 0;
  for (const p of points) {
    const weight = Number((profile.weight + p.delta).toFixed(2));
    const height = profile.height;
    const bmi = Number(((weight / (height / 100) ** 2)).toFixed(2));
    const fat = profile.sexHint === 'F' ? 24 + p.delta : 18 + p.delta;
    await conn.query(
      `INSERT INTO body_composition_logs
        (client_id, recorded_by, measured_at, weight_kg, height_cm, body_fat_pct, bmi,
         chest_cm, waist_cm, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId,
        trainerId,
        dateOnly(daysAgo(p.ago)),
        weight,
        height,
        Number(fat.toFixed(2)),
        bmi,
        profile.sexHint === 'F' ? 90 : 98,
        profile.sexHint === 'F' ? 72 : 84,
        'Medición demo seed',
      ],
    );
    created += 1;
  }
  return { created };
}

async function ensureCheckins(conn, clientId) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS c FROM weekly_checkins WHERE client_id = ?',
    [clientId],
  );
  const count = Number(rows[0].c) || 0;
  if (count >= 2) return { created: 0 };

  const needed = 2 - count;
  const offsets = [10, 3];
  let created = 0;
  for (let i = 0; i < needed; i += 1) {
    await conn.query(
      `INSERT INTO weekly_checkins
        (client_id, created_at, sleep_quality, stress_level, diet_adherence, notes, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      [
        clientId,
        dateOnly(daysAgo(offsets[i] || 1)),
        4,
        2 + (i % 2),
        4,
        'Check-in demo seed',
      ],
    );
    created += 1;
  }
  return { created };
}

async function ensureSessions(conn, clientId, routineIds) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS c FROM workout_sessions WHERE client_id = ?',
    [clientId],
  );
  const count = Number(rows[0].c) || 0;
  if (count >= 4) return { created: 0, sessionIds: [] };

  const usable = routineIds.length
    ? routineIds
    : [{ id: null, nombre_rutina: 'Sesión libre' }];
  const needed = 4 - count;
  const sessionIds = [];
  let created = 0;

  for (let i = 0; i < needed; i += 1) {
    const routine = usable[i % usable.length];
    const finished = daysAgo(1 + i * 2);
    const started = new Date(finished);
    started.setHours(started.getHours() - 1);
    const [result] = await conn.query(
      `INSERT INTO workout_sessions
        (client_id, routine_id, routine_name, started_at, finished_at, status)
       VALUES (?, ?, ?, ?, ?, 'completed')`,
      [
        clientId,
        routine.id,
        truncate(routine.nombre_rutina || 'Entrenamiento', 100),
        started,
        finished,
      ],
    );
    const sessionId = result.insertId;
    sessionIds.push(sessionId);
    created += 1;

    const sets = [
      { name: EX.squat.name, catalogId: EX.squat.id, weight: 40 + i, reps: 8 },
      { name: EX.bench.name, catalogId: EX.bench.id, weight: 30 + i, reps: 8 },
      { name: EX.row.name, catalogId: EX.row.id, weight: 35 + i, reps: 10 },
    ];
    for (const set of sets) {
      for (let sn = 1; sn <= 3; sn += 1) {
        await conn.query(
          `INSERT INTO workout_set_logs
            (session_id, exercise_id, exercise_name, set_number, weight, reps)
           VALUES (?, NULL, ?, ?, ?, ?)`,
          [sessionId, truncate(set.name, 150), sn, set.weight, set.reps],
        );
      }
    }
  }

  return { created, sessionIds };
}

async function ensurePrs(conn, clientId, sessionIds) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS c FROM personal_records WHERE client_id = ?',
    [clientId],
  );
  const count = Number(rows[0].c) || 0;
  if (count >= 3) return { created: 0 };

  const prs = [
    { ex: EX.squat, weight: 60, reps: 5 },
    { ex: EX.bench, weight: 45, reps: 5 },
    { ex: EX.hipThrust, weight: 80, reps: 8 },
  ].slice(0, 3 - count);

  let created = 0;
  for (let i = 0; i < prs.length; i += 1) {
    const pr = prs[i];
    await conn.query(
      `INSERT INTO personal_records
        (client_id, exercise_id, exercise_name, weight, reps, achieved_at, session_id)
       VALUES (?, NULL, ?, ?, ?, ?, ?)`,
      [
        clientId,
        truncate(pr.ex.name, 150),
        pr.weight,
        pr.reps,
        daysAgo(2 + i),
        sessionIds[i] || null,
      ],
    );
    created += 1;
  }
  return { created };
}

async function ensureStreak(conn, clientId) {
  const [rows] = await conn.query(
    'SELECT client_id FROM client_streaks WHERE client_id = ? LIMIT 1',
    [clientId],
  );
  if (rows.length) return { created: false };
  await conn.query(
    `INSERT INTO client_streaks (client_id, current_streak, best_streak, week_goal)
     VALUES (?, 4, 7, 3)`,
    [clientId],
  );
  return { created: true };
}

async function seedClient(conn, client) {
  const profile = CLIENT_PROFILES[client.id];
  if (!profile) {
    console.log(`  skip id=${client.id} (no profile config)`);
    return;
  }

  const trainerId = client.trainer_id;
  console.log(`\n→ ${client.username} (id=${client.id}, trainer=${trainerId}, mode=${profile.mode})`);

  const info = await ensureAlumnosInfo(conn, client.id, profile.info);
  console.log(`  alumnos_info: ${info.created ? 'created' : 'ok'}`);

  const memb = await ensureMembership(conn, client.id, trainerId);
  console.log(`  membership: ${memb.created ? 'created' : 'ok'}`);

  const routines = await ensureWeekRoutines(conn, client.id);
  console.log(
    `  routines: +${routines.createdRoutines} days, +${routines.createdExercises} exercises`,
  );

  const nutr = await ensureNutrition(conn, client.id, trainerId, profile.nutrition);
  console.log(`  nutrition_targets: ${nutr.created ? 'created' : 'ok'}`);

  const diet = await ensureDietPlan(
    conn,
    client.id,
    trainerId,
    profile.dietTitle,
    profile.nutrition,
  );
  console.log(`  diet_plan: ${diet.created ? `created #${diet.planId}` : `ok #${diet.planId}`}`);

  const habits = await ensureHabits(conn, client.id, trainerId);
  console.log(`  habits: +${habits.created}, logs +${habits.logsCreated}`);

  const body = await ensureBodyLogs(conn, client.id, trainerId, profile);
  console.log(`  body_logs: +${body.created}`);

  const checkins = await ensureCheckins(conn, client.id);
  console.log(`  checkins: +${checkins.created}`);

  const sessions = await ensureSessions(conn, client.id, routines.routineIds);
  console.log(`  sessions: +${sessions.created}`);

  const prs = await ensurePrs(conn, client.id, sessions.sessionIds);
  console.log(`  PRs: +${prs.created}`);

  const streak = await ensureStreak(conn, client.id);
  console.log(`  streak: ${streak.created ? 'created' : 'ok'}`);
}

async function main() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'coach_db';
  const port = Number(process.env.DB_PORT) || 4000;
  const useSsl = parseBool(process.env.DB_SSL, /tidbcloud\.com$/i.test(host || ''));

  if (!host || !user || password == null || password === '') {
    console.error('Set DB_HOST, DB_USER, DB_PASSWORD');
    process.exit(1);
  }

  const config = {
    host,
    user,
    password,
    database,
    port,
    connectTimeout: 60000,
  };
  if (useSsl) {
    config.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: parseBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
    };
  }

  console.log(`[seedExistingClientsDemo] Connecting ${user}@${host}:${port}/${database}`);
  const conn = await mysql.createConnection(config);

  try {
    const targetIds = Object.keys(CLIENT_PROFILES).map(Number);
    const [clients] = await conn.query(
      `SELECT id, username, nombre, trainer_id
       FROM usuarios
       WHERE rol = 'client' AND id IN (?)
       ORDER BY id`,
      [targetIds],
    );

    if (!clients.length) {
      console.warn('No target clients found.');
      return;
    }

    for (const client of clients) {
      await conn.beginTransaction();
      try {
        await seedClient(conn, client);
        await conn.commit();
      } catch (err) {
        await conn.rollback();
        console.error(`  FAILED ${client.username}:`, err.message);
        throw err;
      }
    }

    console.log('\n[seedExistingClientsDemo] Done.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('[seedExistingClientsDemo] Error:', err.message);
  process.exit(1);
});
