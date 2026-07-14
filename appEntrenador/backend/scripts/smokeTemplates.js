/**
 * Smoke: create template → assign deep copy → edit template → assert routine unchanged → delete
 */
const db = require('../src/config/db');
const templates = require('../src/modules/templates/templates.service');

async function main() {
  const [trainers] = await db.query(
    "SELECT id, username FROM usuarios WHERE rol = 'trainer' LIMIT 1",
  );
  if (!trainers[0]) {
    throw new Error('No hay trainer en DB para smoke');
  }
  const trainerId = trainers[0].id;

  const created = await templates.createTemplate(trainerId, {
    name: 'Smoke Empuje',
    notes: '',
    exercises: [
      { nombre: 'Press', series: 3, repeticiones: 10, peso: 40, indicaciones: '' },
    ],
  });
  console.log('created', created.id, created.exercises.length);

  const [clients] = await db.query(
    "SELECT id FROM usuarios WHERE rol = 'client' AND trainer_id = ? LIMIT 1",
    [trainerId],
  );

  if (clients[0]) {
    const routine = await templates.assignTemplate(trainerId, created.id, {
      clientId: clients[0].id,
      dia_semana: 'Martes',
    });
    console.log('assigned', routine.id, routine.dia_semana, routine.ejercicios.length);

    await templates.updateTemplate(trainerId, created.id, {
      name: 'Smoke Empuje EDIT',
      notes: 'x',
      exercises: [
        { nombre: 'Press edit', series: 4, repeticiones: 8, peso: 50, indicaciones: '' },
      ],
    });

    const [check] = await db.query(
      'SELECT nombre_rutina FROM rutinas WHERE id = ?',
      [routine.id],
    );
    const unchanged = check[0].nombre_rutina === 'Smoke Empuje';
    console.log('routine_unchanged_after_edit', unchanged);
    if (!unchanged) {
      throw new Error('Deep copy failed: assigned routine mutated');
    }

    await db.query('DELETE FROM rutinas WHERE id = ?', [routine.id]);
  } else {
    console.log('no client to assign — skipped assign check');
  }

  await templates.deleteTemplate(trainerId, created.id);
  console.log('smoke ok');
}

main()
  .catch((err) => {
    console.error('smoke failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
