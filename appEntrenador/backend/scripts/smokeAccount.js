const db = require('../src/config/db');
const accountService = require('../src/modules/account/account.service');

async function main() {
  const [trainers] = await db.query(
    "SELECT id, nombre FROM usuarios WHERE rol = 'trainer' LIMIT 1",
  );
  if (!trainers.length) throw new Error('No trainer');
  const id = trainers[0].id;
  const got = await accountService.getMyAccount(id);
  console.log('[smokeAccount] GET', got.id, got.rol, got.nombre);
  const updated = await accountService.updateMyAccount(
    id,
    { nombre: got.nombre, telefono: '3009998877' },
    null,
  );
  console.log('[smokeAccount] PUT telefono=', updated.account.telefono, 'token=', Boolean(updated.token));
  console.log('[smokeAccount] OK');
}

main()
  .catch((e) => {
    console.error('[smokeAccount] FAIL', e.message);
    process.exitCode = 1;
  })
  .finally(() => db.end().catch(() => {}));
