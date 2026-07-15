/** Unit-ish: normalize + persist edge cases for Feature 029. */
const path = require('path');

// Load normalize by executing a tiny harness against the service
const routinesServicePath = path.join(__dirname, '../src/modules/routines/routines.service.js');
// Re-require fresh modules
delete require.cache[require.resolve(routinesServicePath)];

const pool = require('../src/config/db');

async function main() {
  const routinesService = require('../src/modules/routines/routines.service');
  const [trainers] = await pool.query(
    `SELECT id FROM usuarios WHERE rol = 'trainer' ORDER BY id ASC LIMIT 1`,
  );
  const [clients] = await pool.query(
    `SELECT id FROM usuarios WHERE rol = 'client' AND trainer_id = ? LIMIT 1`,
    [trainers[0].id],
  );
  const [routines] = await pool.query(
    `SELECT id, dia_semana, nombre_rutina FROM rutinas WHERE alumno_id = ? ORDER BY id DESC LIMIT 1`,
    [clients[0].id],
  );

  const cases = [
    {
      name: 'plain A/A',
      ejercicios: [
        { nombre: 'P1', series: 2, repeticiones: 8, peso: 10, rest_time_seconds: 30, superset_letter: 'A' },
        { nombre: 'P2', series: 2, repeticiones: 8, peso: 10, rest_time_seconds: 30, superset_letter: 'A' },
      ],
      expect: ['A', 'A'],
    },
    {
      name: 'object value from broken v-select',
      ejercicios: [
        { nombre: 'O1', series: 2, repeticiones: 8, peso: 10, rest_time_seconds: 30, superset_letter: { title: 'A', value: 'A' } },
        { nombre: 'O2', series: 2, repeticiones: 8, peso: 10, rest_time_seconds: 30, superset_letter: { title: 'A', value: 'A' } },
      ],
      expect: ['A', 'A'],
    },
    {
      name: 'empty / null',
      ejercicios: [
        { nombre: 'E1', series: 1, repeticiones: 8, peso: 10, rest_time_seconds: 30, superset_letter: '' },
        { nombre: 'E2', series: 1, repeticiones: 8, peso: 10, rest_time_seconds: 30, superset_letter: null },
      ],
      expect: [null, null],
    },
  ];

  let failed = 0;
  for (const testCase of cases) {
    const updated = await routinesService.updateRoutine(trainers[0].id, routines[0].id, {
      dia_semana: routines[0].dia_semana,
      nombre_rutina: `Probe ${testCase.name}`.slice(0, 80),
      ejercicios: testCase.ejercicios,
    });
    const got = updated.ejercicios.map((e) => e.superset_letter);
    const ok = JSON.stringify(got) === JSON.stringify(testCase.expect);
    console.log(ok ? 'PASS' : 'FAIL', testCase.name, '→', got);
    if (!ok) failed += 1;
  }

  await pool.end();
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
