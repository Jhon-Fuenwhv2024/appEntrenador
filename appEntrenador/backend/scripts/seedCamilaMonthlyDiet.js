/**
 * Seed: plan ciclo 4 semanas (mensual) para Camila (client_id=5) — trainer Jhon.
 * Uso: node backend/scripts/seedCamilaMonthlyDiet.js
 */
const http = require('http');

const API_HOST = '127.0.0.1';
const API_PORT = 3000;
const CLIENT_ID = 5;
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: API_HOST,
        port: API_PORT,
        path: `/api${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = { raw: data };
          }
          if (res.statusCode >= 400) {
            const err = new Error(parsed?.message || parsed?.error || data || `HTTP ${res.statusCode}`);
            err.status = res.statusCode;
            err.body = parsed;
            reject(err);
            return;
          }
          resolve(parsed);
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function food(name, quantity, unit, calories, protein_g, carbs_g, fats_g) {
  return { food_name: name, quantity, unit, calories, protein_g, carbs_g, fats_g };
}

function meal(name, time_hint, items) {
  return { name, time_hint, items };
}

/** Variantes por semana para que el ciclo se note. */
const WEEK_MENUS = {
  1: {
    Lunes: [
      meal('Desayuno', '08:00', [
        food('Avena cocida', 60, 'g', 220, 8, 38, 4),
        food('Huevo entero', 2, 'unidad', 140, 12, 1, 10),
        food('Plátano', 1, 'unidad', 90, 1, 23, 0),
      ]),
      meal('Almuerzo', '13:00', [
        food('Pechuga de pollo', 150, 'g', 248, 46, 0, 5),
        food('Arroz blanco', 120, 'g', 156, 3, 34, 0),
        food('Brócoli al vapor', 100, 'g', 35, 3, 7, 0),
        food('Aceite de oliva', 5, 'ml', 45, 0, 0, 5),
      ]),
      meal('Cena', '20:00', [
        food('Salmón', 140, 'g', 280, 28, 0, 18),
        food('Ensalada mixta', 150, 'g', 40, 2, 6, 1),
        food('Aguacate', 40, 'g', 64, 1, 3, 6),
      ]),
    ],
    Martes: [
      meal('Desayuno', '08:00', [
        food('Yogur griego', 200, 'g', 130, 18, 8, 2),
        food('Granola', 40, 'g', 180, 4, 28, 6),
        food('Fresas', 100, 'g', 32, 1, 8, 0),
      ]),
      meal('Almuerzo', '13:00', [
        food('Carne magra', 140, 'g', 250, 38, 0, 10),
        food('Papa cocida', 200, 'g', 170, 4, 38, 0),
        food('Ensalada de tomate', 120, 'g', 30, 1, 6, 0),
        food('Aceite de oliva', 8, 'ml', 72, 0, 0, 8),
      ]),
      meal('Cena', '20:00', [
        food('Atún en agua', 120, 'g', 120, 26, 0, 1),
        food('Ensalada de frutas', 1, 'porción', 90, 1, 22, 0),
        food('Pan integral', 40, 'g', 100, 4, 18, 1),
      ]),
    ],
    Miércoles: [
      meal('Desayuno', '08:00', [
        food('Tostadas integrales', 2, 'unidad', 160, 6, 28, 2),
        food('Huevo revuelto', 2, 'unidad', 150, 12, 1, 10),
        food('Queso fresco', 40, 'g', 80, 8, 1, 5),
      ]),
      meal('Almuerzo', '13:00', [
        food('Muslo de pollo', 160, 'g', 260, 36, 0, 12),
        food('Quinoa', 100, 'g', 120, 4, 21, 2),
        food('Zanahoria cocida', 100, 'g', 40, 1, 9, 0),
      ]),
      meal('Cena', '20:00', [
        food('Merluza', 160, 'g', 140, 30, 0, 2),
        food('Verduras salteadas', 180, 'g', 70, 3, 10, 2),
        food('Aceite de oliva', 5, 'ml', 45, 0, 0, 5),
      ]),
    ],
    Jueves: [
      meal('Desayuno', '08:00', [
        food('Batido de proteína', 1, 'porción', 140, 25, 5, 2),
        food('Avena', 40, 'g', 150, 5, 27, 3),
        food('Mantequilla de maní', 15, 'g', 90, 4, 3, 8),
      ]),
      meal('Almuerzo', '13:00', [
        food('Pavo', 150, 'g', 200, 42, 0, 3),
        food('Pasta integral', 100, 'g', 150, 6, 30, 1),
        food('Salsa de tomate', 80, 'g', 30, 1, 6, 0),
      ]),
      meal('Cena', '20:00', [
        food('Tortilla de claras', 4, 'unidad', 70, 14, 1, 0),
        food('Ensalada verde', 150, 'g', 35, 2, 5, 1),
        food('Aceite de oliva', 8, 'ml', 72, 0, 0, 8),
      ]),
    ],
    Viernes: [
      meal('Desayuno', '08:00', [
        food('Arepa de maíz', 1, 'unidad', 170, 4, 34, 2),
        food('Huevo', 1, 'unidad', 70, 6, 0, 5),
        food('Queso', 30, 'g', 100, 7, 1, 8),
      ]),
      meal('Almuerzo', '13:00', [
        food('Pescado blanco', 160, 'g', 150, 32, 0, 2),
        food('Arroz integral', 120, 'g', 140, 3, 30, 1),
        food('Ensalada', 150, 'g', 40, 2, 6, 1),
        food('Aguacate', 30, 'g', 48, 1, 2, 4),
      ]),
      meal('Cena', '20:00', [
        food('Pechuga de pollo', 120, 'g', 198, 37, 0, 4),
        food('Puré de papa', 150, 'g', 130, 3, 28, 1),
        food('Ensalada de pepino', 100, 'g', 16, 1, 3, 0),
      ]),
    ],
    Sábado: [
      meal('Desayuno', '09:00', [
        food('Pancakes de avena', 2, 'unidad', 220, 10, 32, 6),
        food('Miel', 10, 'g', 30, 0, 8, 0),
        food('Yogur natural', 100, 'g', 60, 6, 5, 2),
      ]),
      meal('Almuerzo', '14:00', [
        food('Carne de res', 130, 'g', 280, 32, 0, 16),
        food('Yuca cocida', 150, 'g', 160, 1, 38, 0),
        food('Ensalada', 120, 'g', 30, 1, 5, 1),
      ]),
      meal('Cena', '20:30', [
        food('Pizza casera proteica', 1, 'porción', 320, 28, 30, 10),
        food('Ensalada', 100, 'g', 25, 1, 4, 1),
      ]),
    ],
    Domingo: [
      meal('Desayuno', '09:30', [
        food('Huevos con vegetales', 2, 'unidad', 180, 14, 4, 12),
        food('Pan integral', 50, 'g', 120, 5, 22, 2),
        food('Jugo de naranja', 200, 'ml', 90, 1, 21, 0),
      ]),
      meal('Almuerzo', '14:00', [
        food('Pollo al horno', 160, 'g', 260, 40, 0, 10),
        food('Arroz', 100, 'g', 130, 2, 28, 0),
        food('Ensalada de frutas', 1, 'porción', 90, 1, 22, 0),
      ]),
      meal('Cena', '20:00', [
        food('Sopa de verduras', 300, 'ml', 120, 6, 18, 3),
        food('Atún', 80, 'g', 80, 17, 0, 1),
        food('Galletas de arroz', 2, 'unidad', 70, 1, 15, 1),
      ]),
    ],
  },
};

function rotateWeek(baseWeek, weekIndex) {
  // Variar proteínas/carbos por semana para que el ciclo se note
  const proteinBoost = (weekIndex - 1) * 5;
  const carbShift = (weekIndex - 1) * 8;
  const copy = JSON.parse(JSON.stringify(baseWeek));
  for (const dia of Object.keys(copy)) {
    for (const m of copy[dia]) {
      for (const item of m.items) {
        if (item.protein_g > 10) item.protein_g += proteinBoost;
        if (item.carbs_g > 15) item.carbs_g = Math.max(5, item.carbs_g + (weekIndex % 2 === 0 ? carbShift : -carbShift / 2));
        if (item.fats_g < 1 && /aceite|aguacate|queso|salmón|yema|mantequilla|granola/i.test(item.food_name)) {
          item.fats_g = Math.max(1, item.fats_g);
        }
        // Recalcular kcal aproximada
        item.calories = Math.round(
          item.protein_g * 4 + item.carbs_g * 4 + item.fats_g * 9,
        );
        // Sufijo de semana en el nombre del alimento principal de almuerzo
        if (m.name === 'Almuerzo' && item === m.items[0]) {
          item.food_name = `${item.food_name} (S${weekIndex})`;
        }
      }
    }
  }
  return copy;
}

function buildDays() {
  const days = [];
  for (let week = 1; week <= 4; week += 1) {
    const menu = rotateWeek(WEEK_MENUS[1], week);
    for (const dia of DAYS) {
      days.push({
        week_index: week,
        dia_semana: dia,
        notes: week === 1 ? null : `Variación semana ${week}`,
        meals: menu[dia],
      });
    }
  }
  return days;
}

async function main() {
  const login = await request('POST', '/login', {
    username: 'Jhon',
    password: 'superadmin123',
  });
  const token = login.token;
  if (!token) throw new Error('Login sin token');

  const monday = (() => {
    const d = new Date();
    const day = d.getUTCDay();
    const offset = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  })();

  const payload = {
    client_id: CLIENT_ID,
    title: 'Plan mensual Camila — Definición 4 semanas',
    notes: 'Datos de prueba Feature 064: ciclo de 4 semanas con comidas distintas por día.',
    is_active: true,
    cycle_length_weeks: 4,
    cycle_start_date: monday,
    days: buildDays(),
  };

  console.log(`Creando plan: ${payload.days.length} días (4×7)...`);
  const created = await request('POST', '/trainer/diets', payload, token);
  const plan = created.data;
  console.log('OK plan id=', plan?.id);
  console.log('cycle_length_weeks=', plan?.cycle_length_weeks);
  console.log('cycle_start_date=', plan?.cycle_start_date);
  console.log('day_count=', plan?.day_count);
  console.log('meal_count=', plan?.meal_count);
  console.log('avg macros=', {
    calories: plan?.calories,
    protein_g: plan?.protein_g,
    carbs_g: plan?.carbs_g,
    fats_g: plan?.fats_g,
  });
  console.log('is_active=', plan?.is_active);
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  if (err.body) console.error(JSON.stringify(err.body, null, 2));
  process.exit(1);
});
