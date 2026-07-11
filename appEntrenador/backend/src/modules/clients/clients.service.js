const db = require('../../config/db');

async function getClients() {
  const [clients] = await db.query(
    'SELECT id, nombre, username FROM usuarios WHERE rol = "client"',
  );

  return clients;
}

module.exports = {
  getClients,
};
