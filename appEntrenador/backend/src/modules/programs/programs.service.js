const db = require('../../config/db');
const clientsService = require('../clients/clients.service');
const exercisesService = require('../exercises/exercises.service');
const {
  normalizeSetPrescription,
  serializeSetPrescription,
  mapSetPrescriptionFromDb,
  parseSetPrescription,
} = require('../../shared/routines/setPrescription');

const DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

const DEFAULT_REST = 90;
const MAX_REST = 900;

/** Presets prácticos de mesociclo para el wizard del trainer. */
const PHASE_PRESETS = {
  hypertrophy: {
    key: 'hypertrophy',
    label: 'Hipertrofia / Volumen',
    description: '4–6 semanas de volumen. Sube carga o reps cada microciclo.',
    phase_type: 'hypertrophy',
    intensity_focus: 'volume',
    default_weeks: 4,
    min_weeks: 3,
    max_weeks: 6,
    progression_rule: 'add_weight',
    progression_value: 2.5,
  },
  strength: {
    key: 'strength',
    label: 'Fuerza máxima',
    description: 'Intensidad alta, menos volumen. Progresión de peso por semana.',
    phase_type: 'strength',
    intensity_focus: 'intensity',
    default_weeks: 4,
    min_weeks: 3,
    max_weeks: 6,
    progression_rule: 'add_weight',
    progression_value: 2.5,
  },
  deload: {
    key: 'deload',
    label: 'Descarga',
    description: '1 semana al ~85% del peso para recuperar.',
    phase_type: 'deload',
    intensity_focus: 'recovery',
    default_weeks: 1,
    min_weeks: 1,
    max_weeks: 2,
    progression_rule: 'deload_pct',
    progression_value: 0.85,
  },
  peak: {
    key: 'peak',
    label: 'Pico / Peaking',
    description: '2 semanas de intensidad; carga estable o fine-tuning.',
    phase_type: 'peak',
    intensity_focus: 'intensity',
    default_weeks: 2,
    min_weeks: 1,
    max_weeks: 3,
    progression_rule: 'hold',
    progression_value: null,
  },
  conditioning: {
    key: 'conditioning',
    label: 'Acondicionamiento',
    description: 'Trabajo metabólico; suele subir reps por microciclo.',
    phase_type: 'conditioning',
    intensity_focus: 'volume',
    default_weeks: 3,
    min_weeks: 2,
    max_weeks: 4,
    progression_rule: 'add_reps',
    progression_value: 1,
  },
  custom: {
    key: 'custom',
    label: 'Personalizado',
    description: 'Mesociclo libre; defines duración y progresión.',
    phase_type: 'custom',
    intensity_focus: 'mixed',
    default_weeks: 4,
    min_weeks: 1,
    max_weeks: 12,
    progression_rule: 'same',
    progression_value: null,
  },
};

function createHttpError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function listPresets() {
  return Object.values(PHASE_PRESETS);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDay(raw) {
  const day = typeof raw === 'string' ? raw.trim() : '';
  if (!DAYS.includes(day)) {
    throw createHttpError(`día inválido: ${raw}`, 400);
  }
  return day;
}

function roundWeight(n) {
  return Math.round(Number(n) * 100) / 100;
}

function clonePrescription(raw) {
  const parsed = parseSetPrescription(raw);
  if (!parsed) return null;
  return parsed.map((row) => ({
    set: row.set,
    reps: Number(row.reps),
    weight: Number(row.weight),
  }));
}

/**
 * Aplica regla de microciclo sobre una línea de ejercicio (desde blueprint semana 1).
 * weekOffset = week_index - 1
 */
function applyWeekProgression(exercise, rule, value, weekOffset) {
  const base = {
    nombre: exercise.nombre,
    exercise_id: exercise.exercise_id ?? null,
    series: Number(exercise.series),
    repeticiones: Number(exercise.repeticiones),
    peso: Number(exercise.peso),
    set_prescription: clonePrescription(exercise.set_prescription),
    rest_time_seconds: Number(exercise.rest_time_seconds) || DEFAULT_REST,
    superset_letter: exercise.superset_letter ?? null,
    indicaciones: exercise.indicaciones || null,
    sort_order: exercise.sort_order ?? 0,
  };

  if (!weekOffset || weekOffset < 1 || rule === 'hold' || rule === 'same') {
    return base;
  }

  const v = value == null ? null : Number(value);

  if (rule === 'add_weight' && Number.isFinite(v)) {
    const delta = v * weekOffset;
    base.peso = roundWeight(base.peso + delta);
    if (base.set_prescription) {
      base.set_prescription = base.set_prescription.map((s) => ({
        ...s,
        weight: roundWeight(Number(s.weight) + delta),
      }));
    }
  } else if (rule === 'add_reps' && Number.isFinite(v)) {
    const delta = Math.round(v * weekOffset);
    base.repeticiones = Math.max(1, base.repeticiones + delta);
    if (base.set_prescription) {
      base.set_prescription = base.set_prescription.map((s) => ({
        ...s,
        reps: Math.max(1, Number(s.reps) + delta),
      }));
    }
  } else if (rule === 'deload_pct' && Number.isFinite(v) && v > 0 && v <= 1) {
    base.peso = roundWeight(base.peso * v);
    if (base.set_prescription) {
      base.set_prescription = base.set_prescription.map((s) => ({
        ...s,
        weight: roundWeight(Number(s.weight) * v),
      }));
    }
  }

  return base;
}

/**
 * Overlay memoria de progresión del alumno sobre la Rx del programa.
 */
function applyClientProgression(exercise, lastLog, mode, incrementKg) {
  const out = { ...exercise, set_prescription: clonePrescription(exercise.set_prescription) };
  if (mode === 'template' || !lastLog) {
    return out;
  }

  const lastW = Number(lastLog.weight);
  const lastR = Number(lastLog.reps);
  if (!Number.isFinite(lastW) || !Number.isFinite(lastR)) {
    return out;
  }

  if (mode === 'same_as_last') {
    out.peso = roundWeight(lastW);
    out.repeticiones = Math.max(1, Math.round(lastR));
    if (out.set_prescription) {
      out.set_prescription = out.set_prescription.map((s) => ({
        ...s,
        weight: roundWeight(lastW),
        reps: Math.max(1, Math.round(lastR)),
      }));
    }
    return out;
  }

  if (mode === 'last_plus') {
    const inc = Number.isFinite(Number(incrementKg)) ? Number(incrementKg) : 2.5;
    const nextW = roundWeight(lastW + inc);
    out.peso = nextW;
    out.repeticiones = Math.max(1, Math.round(lastR));
    if (out.set_prescription) {
      out.set_prescription = out.set_prescription.map((s) => ({
        ...s,
        weight: nextW,
        reps: Math.max(1, Math.round(lastR)),
      }));
    } else {
      // Uniform: keep template series count, bump weight from last.
      out.peso = nextW;
    }
    return out;
  }

  return out;
}

async function getLastLiftsByNames(clientId, names) {
  const unique = [...new Set(
    (names || [])
      .map((n) => (typeof n === 'string' ? n.trim() : ''))
      .filter(Boolean),
  )];
  if (!unique.length) return new Map();

  const placeholders = unique.map(() => '?').join(',');
  const [rows] = await db.query(
    `SELECT wsl.exercise_name, wsl.weight, wsl.reps, wsl.created_at
     FROM workout_set_logs wsl
     INNER JOIN workout_sessions ws ON ws.id = wsl.session_id
     WHERE ws.client_id = ?
       AND wsl.exercise_name IN (${placeholders})
     ORDER BY wsl.created_at DESC, wsl.id DESC`,
    [clientId, ...unique],
  );

  const map = new Map();
  for (const row of rows) {
    const key = String(row.exercise_name || '').trim();
    if (!key || map.has(key)) continue;
    map.set(key, {
      weight: Number(row.weight),
      reps: Number(row.reps),
      date: row.created_at,
    });
  }
  return map;
}

async function getClientLastLifts(trainerId, clientId, namesQuery) {
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
  let names = [];
  if (typeof namesQuery === 'string' && namesQuery.trim()) {
    names = namesQuery.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (!names.length) {
    // Default: names from current client routines
    const [rows] = await db.query(
      `SELECT DISTINCT e.nombre
       FROM ejercicios e
       INNER JOIN rutinas r ON r.id = e.rutina_id
       WHERE r.alumno_id = ?`,
      [clientId],
    );
    names = rows.map((r) => r.nombre);
  }
  const map = await getLastLiftsByNames(clientId, names);
  return [...map.entries()].map(([nombre, last]) => ({ nombre, ...last }));
}

async function assertProgramOwned(programId, trainerId) {
  const id = Number(programId);
  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError('Programa inválido.', 400);
  }
  const [rows] = await db.query(
    `SELECT id, trainer_id, name, goal, planned_weeks, notes, created_at, updated_at
     FROM training_programs
     WHERE id = ? AND trainer_id = ?
     LIMIT 1`,
    [id, trainerId],
  );
  if (!rows.length) {
    throw createHttpError('Programa no encontrado.', 404);
  }
  return rows[0];
}

async function listPrograms(trainerId) {
  const [rows] = await db.query(
    `SELECT p.id, p.name, p.goal, p.planned_weeks, p.notes, p.created_at, p.updated_at,
            (SELECT COUNT(*) FROM program_phases ph WHERE ph.program_id = p.id) AS phases_count
     FROM training_programs p
     WHERE p.trainer_id = ?
     ORDER BY p.updated_at DESC, p.id DESC`,
    [trainerId],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    goal: r.goal,
    planned_weeks: r.planned_weeks,
    notes: r.notes,
    phases_count: Number(r.phases_count) || 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

async function loadPhaseTree(phaseId) {
  const [weeks] = await db.query(
    `SELECT id, phase_id, week_index, name, progression_rule, progression_value, notes
     FROM program_weeks
     WHERE phase_id = ?
     ORDER BY week_index ASC`,
    [phaseId],
  );
  if (!weeks.length) return [];

  const weekIds = weeks.map((w) => w.id);
  const ph = weekIds.map(() => '?').join(',');
  const [days] = await db.query(
    `SELECT id, week_id, dia_semana, name, sort_order
     FROM program_days
     WHERE week_id IN (${ph})
     ORDER BY sort_order ASC, id ASC`,
    weekIds,
  );
  const dayIds = days.map((d) => d.id);
  let exercises = [];
  if (dayIds.length) {
    const dph = dayIds.map(() => '?').join(',');
    const [exRows] = await db.query(
      `SELECT id, program_day_id, nombre, exercise_id, series, repeticiones, peso,
              set_prescription, rest_time_seconds, superset_letter, indicaciones, sort_order
       FROM program_exercises
       WHERE program_day_id IN (${dph})
       ORDER BY sort_order ASC, id ASC`,
      dayIds,
    );
    exercises = exRows;
  }

  const exByDay = new Map();
  for (const ex of exercises) {
    const list = exByDay.get(ex.program_day_id) || [];
    list.push({
      id: ex.id,
      nombre: ex.nombre,
      exercise_id: ex.exercise_id,
      series: ex.series,
      repeticiones: ex.repeticiones,
      peso: Number(ex.peso),
      set_prescription: mapSetPrescriptionFromDb(ex.set_prescription),
      rest_time_seconds: Number(ex.rest_time_seconds) || DEFAULT_REST,
      superset_letter: ex.superset_letter,
      indicaciones: ex.indicaciones,
      sort_order: ex.sort_order,
    });
    exByDay.set(ex.program_day_id, list);
  }

  const daysByWeek = new Map();
  for (const d of days) {
    const list = daysByWeek.get(d.week_id) || [];
    list.push({
      id: d.id,
      dia_semana: d.dia_semana,
      name: d.name,
      sort_order: d.sort_order,
      exercises: exByDay.get(d.id) || [],
    });
    daysByWeek.set(d.week_id, list);
  }

  return weeks.map((w) => ({
    id: w.id,
    week_index: w.week_index,
    name: w.name,
    progression_rule: w.progression_rule,
    progression_value: w.progression_value == null ? null : Number(w.progression_value),
    notes: w.notes,
    days: daysByWeek.get(w.id) || [],
  }));
}

async function getProgramById(trainerId, programId) {
  const program = await assertProgramOwned(programId, trainerId);
  const [phases] = await db.query(
    `SELECT id, program_id, name, phase_type, intensity_focus, sort_order, duration_weeks, notes
     FROM program_phases
     WHERE program_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [program.id],
  );

  const phasesOut = [];
  for (const ph of phases) {
    phasesOut.push({
      id: ph.id,
      name: ph.name,
      phase_type: ph.phase_type,
      intensity_focus: ph.intensity_focus,
      sort_order: ph.sort_order,
      duration_weeks: ph.duration_weeks,
      notes: ph.notes,
      weeks: await loadPhaseTree(ph.id),
    });
  }

  return {
    id: program.id,
    name: program.name,
    goal: program.goal,
    planned_weeks: program.planned_weeks,
    notes: program.notes,
    created_at: program.created_at,
    updated_at: program.updated_at,
    phases: phasesOut,
  };
}

async function createProgram(trainerId, payload = {}) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name) throw createHttpError('El nombre del programa es obligatorio.', 400);
  const goal = typeof payload.goal === 'string' ? payload.goal.trim() : null;
  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : null;
  let planned = payload.planned_weeks == null || payload.planned_weeks === ''
    ? null
    : Number(payload.planned_weeks);
  if (planned != null && (!Number.isInteger(planned) || planned < 1 || planned > 52)) {
    throw createHttpError('planned_weeks debe ser 1–52.', 400);
  }

  const [result] = await db.query(
    `INSERT INTO training_programs (trainer_id, name, goal, planned_weeks, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [trainerId, name, goal || null, planned, notes || null],
  );
  return getProgramById(trainerId, result.insertId);
}

async function updateProgram(trainerId, programId, payload = {}) {
  await assertProgramOwned(programId, trainerId);
  const fields = [];
  const values = [];

  if (payload.name != null) {
    const name = String(payload.name).trim();
    if (!name) throw createHttpError('Nombre vacío.', 400);
    fields.push('name = ?');
    values.push(name);
  }
  if (payload.goal !== undefined) {
    fields.push('goal = ?');
    values.push(payload.goal == null || payload.goal === '' ? null : String(payload.goal).trim());
  }
  if (payload.notes !== undefined) {
    fields.push('notes = ?');
    values.push(payload.notes == null || payload.notes === '' ? null : String(payload.notes).trim());
  }
  if (payload.planned_weeks !== undefined) {
    let planned = payload.planned_weeks == null || payload.planned_weeks === ''
      ? null
      : Number(payload.planned_weeks);
    if (planned != null && (!Number.isInteger(planned) || planned < 1 || planned > 52)) {
      throw createHttpError('planned_weeks debe ser 1–52.', 400);
    }
    fields.push('planned_weeks = ?');
    values.push(planned);
  }

  if (!fields.length) {
    return getProgramById(trainerId, programId);
  }

  values.push(programId, trainerId);
  await db.query(
    `UPDATE training_programs SET ${fields.join(', ')} WHERE id = ? AND trainer_id = ?`,
    values,
  );
  return getProgramById(trainerId, programId);
}

async function deleteProgram(trainerId, programId) {
  await assertProgramOwned(programId, trainerId);
  await db.query(
    'DELETE FROM training_programs WHERE id = ? AND trainer_id = ?',
    [programId, trainerId],
  );
}

function normalizeExerciseLine(item, index) {
  const nombre = typeof item.nombre === 'string' ? item.nombre.trim() : '';
  if (!nombre) throw createHttpError(`Ejercicio #${index + 1} sin nombre.`, 400);
  let series = Number(item.series);
  let repeticiones = Number(item.repeticiones);
  let peso = Number(item.peso);
  if (!Number.isInteger(series) || series < 1) {
    throw createHttpError(`Series inválidas en "${nombre}".`, 400);
  }
  if (!Number.isInteger(repeticiones) || repeticiones < 1) {
    throw createHttpError(`Reps inválidas en "${nombre}".`, 400);
  }
  if (Number.isNaN(peso) || peso < 0) {
    throw createHttpError(`Peso inválido en "${nombre}".`, 400);
  }
  const prescription = normalizeSetPrescription(item, nombre, series, repeticiones, peso);
  let rest = item.rest_time_seconds == null || item.rest_time_seconds === ''
    ? DEFAULT_REST
    : Number(item.rest_time_seconds);
  if (!Number.isFinite(rest) || rest < 0 || rest > MAX_REST) {
    throw createHttpError(`Descanso inválido en "${nombre}".`, 400);
  }
  let letter = item.superset_letter;
  if (letter == null || letter === '') letter = null;
  else {
    letter = String(letter).trim().toUpperCase();
    if (!/^[A-Z0-9]{1,2}$/.test(letter)) {
      throw createHttpError(`Grupo inválido en "${nombre}".`, 400);
    }
  }
  let exercise_id = item.exercise_id == null || item.exercise_id === ''
    ? null
    : Number(item.exercise_id);
  if (exercise_id != null && (!Number.isInteger(exercise_id) || exercise_id < 1)) {
    throw createHttpError(`exercise_id inválido en "${nombre}".`, 400);
  }

  return {
    nombre,
    exercise_id,
    series: prescription.series,
    repeticiones: prescription.repeticiones,
    peso: prescription.peso,
    set_prescription: prescription.set_prescription,
    rest_time_seconds: Math.round(rest),
    superset_letter: letter,
    indicaciones: typeof item.indicaciones === 'string' ? item.indicaciones.trim() : null,
    sort_order: index,
  };
}

async function insertDayExercises(connection, programDayId, exercises) {
  for (const ex of exercises) {
    await connection.query(
      `INSERT INTO program_exercises
         (program_day_id, nombre, exercise_id, series, repeticiones, peso,
          set_prescription, rest_time_seconds, superset_letter, indicaciones, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        programDayId,
        ex.nombre,
        ex.exercise_id,
        ex.series,
        ex.repeticiones,
        ex.peso,
        serializeSetPrescription(ex.set_prescription),
        ex.rest_time_seconds,
        ex.superset_letter,
        ex.indicaciones || null,
        ex.sort_order,
      ],
    );
  }
}

async function loadTemplateExercises(trainerId, templateId) {
  const [tpl] = await db.query(
    `SELECT id, name FROM routine_templates WHERE id = ? AND trainer_id = ? LIMIT 1`,
    [templateId, trainerId],
  );
  if (!tpl.length) {
    throw createHttpError(`Plantilla ${templateId} no encontrada.`, 404);
  }
  const [exRows] = await db.query(
    `SELECT nombre, exercise_id, series, repeticiones, peso, set_prescription,
            rest_time_seconds, superset_letter, indicaciones, sort_order
     FROM template_exercises
     WHERE template_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [templateId],
  );
  if (!exRows.length) {
    throw createHttpError(`La plantilla "${tpl[0].name}" no tiene ejercicios.`, 400);
  }
  return {
    name: tpl[0].name,
    exercises: exRows.map((ex, index) => normalizeExerciseLine({
      ...ex,
      set_prescription: mapSetPrescriptionFromDb(ex.set_prescription),
      peso: Number(ex.peso),
    }, index)),
  };
}

/**
 * Crea mesociclo desde preset + opcional seed de días (plantillas) en semana 1;
 * luego propaga a las demás semanas.
 */
async function addPhase(trainerId, programId, payload = {}) {
  await assertProgramOwned(programId, trainerId);

  const presetKey = typeof payload.preset === 'string' ? payload.preset.trim() : 'custom';
  const preset = PHASE_PRESETS[presetKey] || PHASE_PRESETS.custom;

  let duration = payload.duration_weeks == null
    ? preset.default_weeks
    : Number(payload.duration_weeks);
  if (!Number.isInteger(duration) || duration < preset.min_weeks || duration > preset.max_weeks) {
    throw createHttpError(
      `duration_weeks debe ser ${preset.min_weeks}–${preset.max_weeks} para ${preset.label}.`,
      400,
    );
  }

  const name = (typeof payload.name === 'string' && payload.name.trim())
    || preset.label;
  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : null;
  const phaseType = payload.phase_type || preset.phase_type;
  const intensity = payload.intensity_focus || preset.intensity_focus;
  const rule = payload.progression_rule || preset.progression_rule;
  const progValue = payload.progression_value !== undefined
    ? payload.progression_value
    : preset.progression_value;

  const seedDays = Array.isArray(payload.seed_days) ? payload.seed_days : [];
  // seed_days: [{ dia_semana, template_id }] OR [{ dia_semana, name, exercises }]
  const resolvedSeeds = [];
  for (const seed of seedDays) {
    const dia = normalizeDay(seed.dia_semana);
    if (seed.template_id) {
      const tpl = await loadTemplateExercises(trainerId, Number(seed.template_id));
      resolvedSeeds.push({
        dia_semana: dia,
        name: (typeof seed.name === 'string' && seed.name.trim()) || tpl.name,
        exercises: tpl.exercises,
      });
    } else if (Array.isArray(seed.exercises) && seed.exercises.length) {
      resolvedSeeds.push({
        dia_semana: dia,
        name: (typeof seed.name === 'string' && seed.name.trim()) || `Día ${dia}`,
        exercises: seed.exercises.map((ex, i) => normalizeExerciseLine(ex, i)),
      });
    }
  }

  const [[sortRow]] = await db.query(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort
     FROM program_phases WHERE program_id = ?`,
    [programId],
  );
  const sortOrder = Number(sortRow.next_sort) || 0;

  const connection = await db.getConnection();
  let phaseId;
  try {
    await connection.beginTransaction();

    const [phRes] = await connection.query(
      `INSERT INTO program_phases
         (program_id, name, phase_type, intensity_focus, sort_order, duration_weeks, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [programId, name, phaseType, intensity, sortOrder, duration, notes || null],
    );
    phaseId = phRes.insertId;

    const weekIds = [];
    for (let w = 1; w <= duration; w += 1) {
      const [wRes] = await connection.query(
        `INSERT INTO program_weeks
           (phase_id, week_index, name, progression_rule, progression_value)
         VALUES (?, ?, ?, ?, ?)`,
        [
          phaseId,
          w,
          `Semana ${w}`,
          rule,
          progValue == null || progValue === '' ? null : Number(progValue),
        ],
      );
      weekIds.push({ week_index: w, id: wRes.insertId });
    }

    // Seed week 1 days
    const week1 = weekIds.find((w) => w.week_index === 1);
    for (let i = 0; i < resolvedSeeds.length; i += 1) {
      const seed = resolvedSeeds[i];
      const [dRes] = await connection.query(
        `INSERT INTO program_days (week_id, dia_semana, name, sort_order)
         VALUES (?, ?, ?, ?)`,
        [week1.id, seed.dia_semana, seed.name, i],
      );
      const resolved = await exercisesService.resolveExerciseIdsForLines(
        seed.exercises,
        trainerId,
      );
      await insertDayExercises(connection, dRes.insertId, resolved.map((ex, idx) => ({
        ...ex,
        sort_order: idx,
      })));
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  // Propagate week 1 → rest if duration > 1 and week 1 has days
  if (duration > 1 && resolvedSeeds.length) {
    await propagatePhase(trainerId, programId, phaseId);
  }

  return getProgramById(trainerId, programId);
}

async function assertPhaseInProgram(trainerId, programId, phaseId) {
  await assertProgramOwned(programId, trainerId);
  const [rows] = await db.query(
    `SELECT id, program_id, name, duration_weeks
     FROM program_phases
     WHERE id = ? AND program_id = ?
     LIMIT 1`,
    [phaseId, programId],
  );
  if (!rows.length) throw createHttpError('Fase no encontrada.', 404);
  return rows[0];
}

/**
 * Copia días/ejercicios de semana 1 a semanas 2..N aplicando progression_rule de cada week.
 */
async function propagatePhase(trainerId, programId, phaseId) {
  await assertPhaseInProgram(trainerId, programId, phaseId);
  const weeks = await loadPhaseTree(phaseId);
  const week1 = weeks.find((w) => w.week_index === 1);
  if (!week1 || !week1.days.length) {
    throw createHttpError('La semana 1 no tiene días para propagar.', 400);
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const week of weeks) {
      if (week.week_index === 1) continue;

      // Clear existing days (cascade exercises)
      await connection.query('DELETE FROM program_days WHERE week_id = ?', [week.id]);

      const offset = week.week_index - 1;
      for (let i = 0; i < week1.days.length; i += 1) {
        const day = week1.days[i];
        const [dRes] = await connection.query(
          `INSERT INTO program_days (week_id, dia_semana, name, sort_order)
           VALUES (?, ?, ?, ?)`,
          [week.id, day.dia_semana, day.name, i],
        );
        const progressed = day.exercises.map((ex) => applyWeekProgression(
          ex,
          week.progression_rule,
          week.progression_value,
          offset,
        ));
        await insertDayExercises(connection, dRes.insertId, progressed);
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getProgramById(trainerId, programId);
}

/**
 * Upsert días completos de un microciclo (reemplaza días del week_id).
 */
async function upsertWeekDays(trainerId, programId, weekId, payload = {}) {
  await assertProgramOwned(programId, trainerId);
  const [weekRows] = await db.query(
    `SELECT w.id, w.phase_id, w.week_index
     FROM program_weeks w
     INNER JOIN program_phases ph ON ph.id = w.phase_id
     WHERE w.id = ? AND ph.program_id = ?
     LIMIT 1`,
    [weekId, programId],
  );
  if (!weekRows.length) throw createHttpError('Microciclo no encontrado.', 404);

  const daysPayload = Array.isArray(payload.days) ? payload.days : [];
  if (!daysPayload.length) {
    throw createHttpError('Debes enviar al menos un día.', 400);
  }

  const normalizedDays = [];
  for (let i = 0; i < daysPayload.length; i += 1) {
    const d = daysPayload[i];
    const dia = normalizeDay(d.dia_semana);
    let exercises = [];
    if (d.template_id) {
      const tpl = await loadTemplateExercises(trainerId, Number(d.template_id));
      exercises = tpl.exercises;
      normalizedDays.push({
        dia_semana: dia,
        name: (typeof d.name === 'string' && d.name.trim()) || tpl.name,
        exercises,
        sort_order: i,
      });
    } else {
      if (!Array.isArray(d.exercises) || !d.exercises.length) {
        throw createHttpError(`El día ${dia} necesita ejercicios o template_id.`, 400);
      }
      exercises = d.exercises.map((ex, idx) => normalizeExerciseLine(ex, idx));
      normalizedDays.push({
        dia_semana: dia,
        name: (typeof d.name === 'string' && d.name.trim()) || `Día ${dia}`,
        exercises,
        sort_order: i,
      });
    }
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM program_days WHERE week_id = ?', [weekId]);
    for (const day of normalizedDays) {
      const resolved = await exercisesService.resolveExerciseIdsForLines(
        day.exercises,
        trainerId,
      );
      const [dRes] = await connection.query(
        `INSERT INTO program_days (week_id, dia_semana, name, sort_order)
         VALUES (?, ?, ?, ?)`,
        [weekId, day.dia_semana, day.name, day.sort_order],
      );
      await insertDayExercises(connection, dRes.insertId, resolved.map((ex, idx) => ({
        ...ex,
        sort_order: idx,
      })));
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getProgramById(trainerId, programId);
}

async function clearMaterializedRoutines(connection, assignmentId) {
  await connection.query(
    'DELETE FROM rutinas WHERE assignment_id = ?',
    [assignmentId],
  );
}

async function materializeWeek(connection, assignment, weekIndex, trainerId) {
  const phaseId = assignment.phase_id;
  let weeksQuery;
  let weeksParams;
  if (phaseId) {
    weeksQuery = `
      SELECT w.id, w.week_index, w.progression_rule, w.progression_value
      FROM program_weeks w
      WHERE w.phase_id = ? AND w.week_index = ?
      LIMIT 1`;
    weeksParams = [phaseId, weekIndex];
  } else {
    // First phase of program by sort_order
    weeksQuery = `
      SELECT w.id, w.week_index, w.progression_rule, w.progression_value
      FROM program_weeks w
      INNER JOIN program_phases ph ON ph.id = w.phase_id
      WHERE ph.program_id = ?
      ORDER BY ph.sort_order ASC, ph.id ASC, w.week_index ASC`;
    weeksParams = [assignment.program_id];
  }

  const [weekRows] = await connection.query(weeksQuery, weeksParams);
  let week;
  if (phaseId) {
    week = weekRows[0];
  } else {
    // Flatten: weekIndex is global within first phase for MVP when phase_id null
    const [phases] = await connection.query(
      `SELECT id FROM program_phases WHERE program_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1`,
      [assignment.program_id],
    );
    if (!phases.length) throw createHttpError('El programa no tiene fases.', 400);
    const [w] = await connection.query(
      `SELECT id, week_index, progression_rule, progression_value
       FROM program_weeks WHERE phase_id = ? AND week_index = ? LIMIT 1`,
      [phases[0].id, weekIndex],
    );
    week = w[0];
  }

  if (!week) {
    throw createHttpError(`No existe el microciclo ${weekIndex}.`, 400);
  }

  const [days] = await connection.query(
    `SELECT id, dia_semana, name FROM program_days WHERE week_id = ? ORDER BY sort_order ASC`,
    [week.id],
  );
  if (!days.length) {
    throw createHttpError('El microciclo no tiene días prescritos.', 400);
  }

  const dayIds = days.map((d) => d.id);
  const ph = dayIds.map(() => '?').join(',');
  const [exRows] = await connection.query(
    `SELECT * FROM program_exercises WHERE program_day_id IN (${ph}) ORDER BY sort_order ASC, id ASC`,
    dayIds,
  );
  const exByDay = new Map();
  for (const ex of exRows) {
    const list = exByDay.get(ex.program_day_id) || [];
    list.push({
      nombre: ex.nombre,
      exercise_id: ex.exercise_id,
      series: ex.series,
      repeticiones: ex.repeticiones,
      peso: Number(ex.peso),
      set_prescription: mapSetPrescriptionFromDb(ex.set_prescription),
      rest_time_seconds: Number(ex.rest_time_seconds) || DEFAULT_REST,
      superset_letter: ex.superset_letter,
      indicaciones: ex.indicaciones,
    });
    exByDay.set(ex.program_day_id, list);
  }

  const allNames = exRows.map((e) => e.nombre);
  const lastMap = await getLastLiftsByNames(assignment.client_id, allNames);

  await clearMaterializedRoutines(connection, assignment.id);

  const created = [];
  for (const day of days) {
    let exercises = exByDay.get(day.id) || [];
    exercises = await exercisesService.resolveExerciseIdsForLines(exercises, trainerId);
    exercises = exercises.map((ex) => applyClientProgression(
      ex,
      lastMap.get(String(ex.nombre).trim()) || null,
      assignment.progression_mode,
      assignment.progression_increment_kg,
    ));

    const [rRes] = await connection.query(
      `INSERT INTO rutinas
         (alumno_id, dia_semana, nombre_rutina, assignment_id, program_day_id, source_week_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        assignment.client_id,
        day.dia_semana,
        day.name,
        assignment.id,
        day.id,
        weekIndex,
      ],
    );

    for (const ex of exercises) {
      await connection.query(
        `INSERT INTO ejercicios
           (rutina_id, nombre, exercise_id, series, repeticiones, indicaciones, peso,
            set_prescription, rest_time_seconds, superset_letter)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rRes.insertId,
          ex.nombre,
          ex.exercise_id,
          ex.series,
          ex.repeticiones,
          ex.indicaciones || null,
          ex.peso,
          serializeSetPrescription(ex.set_prescription),
          ex.rest_time_seconds || DEFAULT_REST,
          ex.superset_letter ?? null,
        ],
      );
    }
    created.push({ routine_id: rRes.insertId, dia_semana: day.dia_semana, name: day.name });
  }

  return created;
}

async function assignProgram(trainerId, programId, payload = {}) {
  await assertProgramOwned(programId, trainerId);
  const clientId = Number(payload.clientId);
  if (!Number.isInteger(clientId) || clientId < 1) {
    throw createHttpError('clientId inválido.', 400);
  }
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);

  let phaseId = payload.phaseId == null || payload.phaseId === ''
    ? null
    : Number(payload.phaseId);
  if (phaseId != null) {
    await assertPhaseInProgram(trainerId, programId, phaseId);
  } else {
    const [phases] = await db.query(
      `SELECT id FROM program_phases WHERE program_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1`,
      [programId],
    );
    if (!phases.length) {
      throw createHttpError('Añade al menos un mesociclo antes de asignar.', 400);
    }
    phaseId = phases[0].id;
  }

  const startDate = typeof payload.start_date === 'string' && payload.start_date.trim()
    ? payload.start_date.trim().slice(0, 10)
    : todayIsoDate();

  const mode = payload.progression_mode || 'last_plus';
  if (!['template', 'same_as_last', 'last_plus'].includes(mode)) {
    throw createHttpError('progression_mode inválido.', 400);
  }
  let increment = payload.progression_increment_kg == null
    ? 2.5
    : Number(payload.progression_increment_kg);
  if (!Number.isFinite(increment) || increment < 0 || increment > 50) {
    throw createHttpError('progression_increment_kg inválido (0–50).', 400);
  }

  // Pause other active assignments for this client
  const connection = await db.getConnection();
  let assignmentId;
  let materialized;
  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE client_program_assignments
       SET status = 'paused'
       WHERE client_id = ? AND status = 'active'`,
      [clientId],
    );

    const [aRes] = await connection.query(
      `INSERT INTO client_program_assignments
         (client_id, program_id, phase_id, start_date, status, current_week_index,
          progression_mode, progression_increment_kg, assigned_by)
       VALUES (?, ?, ?, ?, 'active', 1, ?, ?, ?)`,
      [clientId, programId, phaseId, startDate, mode, increment, trainerId],
    );
    assignmentId = aRes.insertId;

    const assignment = {
      id: assignmentId,
      client_id: clientId,
      program_id: programId,
      phase_id: phaseId,
      progression_mode: mode,
      progression_increment_kg: increment,
    };
    materialized = await materializeWeek(connection, assignment, 1, trainerId);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getAssignment(trainerId, assignmentId, materialized);
}

async function getAssignment(trainerId, assignmentId, materialized = null) {
  const [rows] = await db.query(
    `SELECT a.*, p.name AS program_name, p.trainer_id,
            ph.name AS phase_name, ph.duration_weeks
     FROM client_program_assignments a
     INNER JOIN training_programs p ON p.id = a.program_id
     LEFT JOIN program_phases ph ON ph.id = a.phase_id
     WHERE a.id = ? AND p.trainer_id = ?
     LIMIT 1`,
    [assignmentId, trainerId],
  );
  if (!rows.length) throw createHttpError('Asignación no encontrada.', 404);
  const a = rows[0];
  return {
    id: a.id,
    client_id: a.client_id,
    program_id: a.program_id,
    program_name: a.program_name,
    phase_id: a.phase_id,
    phase_name: a.phase_name,
    duration_weeks: a.duration_weeks,
    start_date: a.start_date,
    status: a.status,
    current_week_index: a.current_week_index,
    progression_mode: a.progression_mode,
    progression_increment_kg: Number(a.progression_increment_kg),
    created_at: a.created_at,
    materialized_routines: materialized,
  };
}

async function listClientAssignments(trainerId, clientId) {
  await clientsService.getClientOwnedByTrainer(clientId, trainerId);
  const [rows] = await db.query(
    `SELECT a.id, a.client_id, a.program_id, a.phase_id, a.start_date, a.status,
            a.current_week_index, a.progression_mode, a.progression_increment_kg, a.created_at,
            p.name AS program_name, ph.name AS phase_name, ph.duration_weeks
     FROM client_program_assignments a
     INNER JOIN training_programs p ON p.id = a.program_id
     LEFT JOIN program_phases ph ON ph.id = a.phase_id
     WHERE a.client_id = ? AND p.trainer_id = ?
     ORDER BY a.status = 'active' DESC, a.created_at DESC`,
    [clientId, trainerId],
  );
  return rows.map((a) => ({
    id: a.id,
    client_id: a.client_id,
    program_id: a.program_id,
    program_name: a.program_name,
    phase_id: a.phase_id,
    phase_name: a.phase_name,
    duration_weeks: a.duration_weeks,
    start_date: a.start_date,
    status: a.status,
    current_week_index: a.current_week_index,
    progression_mode: a.progression_mode,
    progression_increment_kg: Number(a.progression_increment_kg),
    created_at: a.created_at,
  }));
}

async function advanceAssignmentWeek(trainerId, assignmentId) {
  const current = await getAssignment(trainerId, assignmentId);
  if (current.status !== 'active') {
    throw createHttpError('Solo se puede avanzar una asignación activa.', 400);
  }
  const maxWeek = Number(current.duration_weeks) || 1;
  const next = current.current_week_index + 1;
  if (next > maxWeek) {
    await db.query(
      `UPDATE client_program_assignments SET status = 'completed' WHERE id = ?`,
      [assignmentId],
    );
    return {
      ...current,
      status: 'completed',
      message: 'Mesociclo completado. No hay más microciclos.',
    };
  }

  const connection = await db.getConnection();
  let materialized;
  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE client_program_assignments SET current_week_index = ? WHERE id = ?`,
      [next, assignmentId],
    );
    const assignment = {
      id: assignmentId,
      client_id: current.client_id,
      program_id: current.program_id,
      phase_id: current.phase_id,
      progression_mode: current.progression_mode,
      progression_increment_kg: current.progression_increment_kg,
    };
    materialized = await materializeWeek(connection, assignment, next, trainerId);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getAssignment(trainerId, assignmentId, materialized);
}

module.exports = {
  DAYS,
  PHASE_PRESETS,
  listPresets,
  listPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  addPhase,
  propagatePhase,
  upsertWeekDays,
  assignProgram,
  listClientAssignments,
  getAssignment,
  advanceAssignmentWeek,
  getClientLastLifts,
  applyWeekProgression,
  applyClientProgression,
};
