const fs = require('fs');
const p = 'c:/Users/jhonf/OneDrive/Documentos/appEntrenador/appEntrenador/backend/src/server.js';
let c = fs.readFileSync(p, 'utf8');

const fixes = [
  [/vacÃ­o/g, 'vacío'],
  [/producciÃ³n/g, 'producción'],
  [/pÃºblico/g, 'público'],
  [/hÃ¡bitos/g, 'hábitos'],
  [/membresÃ­a/g, 'membresía'],
  [/fallÃ³/g, 'falló'],
  [/â€”/g, '—'],
  [/â€“/g, '–'],
];

for (const [re, to] of fixes) {
  c = c.replace(re, to);
}

fs.writeFileSync(p, c, 'utf8');
console.log('server.js encoding fixed');
