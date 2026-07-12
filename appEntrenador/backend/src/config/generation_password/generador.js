const bcrypt = require('bcrypt');
const saltRounds = 10;
const miPasswordPlano = 'Tiago123'; // Cambia esto por la contraseña que quieras

bcrypt.hash(miPasswordPlano, saltRounds, function(err, hash) {
    console.log("Copia este hash y pégalo en tu base de datos: " + hash);
});