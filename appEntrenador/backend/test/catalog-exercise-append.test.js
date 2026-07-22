const assert = require('node:assert/strict');
const { after, afterEach, test } = require('node:test');

const db = require('../src/config/db');
const exercisesService = require('../src/modules/exercises/exercises.service');
const routinesService = require('../src/modules/routines/routines.service');
const templatesService = require('../src/modules/templates/templates.service');

const originalQuery = db.query.bind(db);
const originalCatalogCheck = exercisesService.assertCatalogExerciseIdsVisible;

const exercisePayload = {
  nombre: 'Press banca',
  exercise_id: 42,
  series: 4,
  repeticiones: 10,
  peso: 60,
  rest_time_seconds: 90,
  superset_letter: null,
  indicaciones: 'Controlar la bajada',
};

afterEach(() => {
  db.query = originalQuery;
  exercisesService.assertCatalogExerciseIdsVisible = originalCatalogCheck;
});

after(async () => {
  await db.end();
});

test('routine catalog assignment inserts one line without replacing existing exercises', async () => {
  const queries = [];
  exercisesService.assertCatalogExerciseIdsVisible = async (ids, trainerId) => {
    assert.deepEqual(ids, [42]);
    assert.equal(trainerId, 7);
  };
  db.query = async (sql, params) => {
    queries.push({ sql, params });
    if (sql.includes('SELECT r.id, r.alumno_id')) {
      return [[{
        id: 12,
        alumno_id: 30,
        dia_semana: 'Lunes',
        nombre_rutina: 'Empuje',
      }]];
    }
    if (sql.includes('INSERT INTO ejercicios')) {
      return [{ affectedRows: 1, insertId: 99 }];
    }
    throw new Error(`Unexpected query: ${sql}`);
  };

  const result = await routinesService.appendExerciseToRoutine(7, 12, exercisePayload);

  assert.equal(result.id, 99);
  assert.equal(result.rutina_id, 12);
  assert.equal(result.alumno_id, 30);
  assert.equal(queries.length, 2);
  assert.match(queries[1].sql, /INSERT INTO ejercicios/);
  assert.match(queries[1].sql, /u\.trainer_id = \?/);
  assert.doesNotMatch(queries[1].sql, /DELETE FROM ejercicios/);
});

test('template catalog assignment appends at the next order without replacing lines', async () => {
  const queries = [];
  exercisesService.assertCatalogExerciseIdsVisible = async (ids, trainerId) => {
    assert.deepEqual(ids, [42]);
    assert.equal(trainerId, 7);
  };
  db.query = async (sql, params) => {
    queries.push({ sql, params });
    return [{ affectedRows: 1, insertId: 101 }];
  };

  const result = await templatesService.appendExerciseToTemplate(7, 15, exercisePayload);

  assert.equal(result.id, 101);
  assert.equal(result.template_id, 15);
  assert.equal(queries.length, 1);
  assert.match(queries[0].sql, /INSERT INTO template_exercises/);
  assert.match(queries[0].sql, /COALESCE\(MAX\(te\.sort_order\), -1\) \+ 1/);
  assert.match(queries[0].sql, /t\.trainer_id = \?/);
  assert.doesNotMatch(queries[0].sql, /DELETE FROM template_exercises/);
});
