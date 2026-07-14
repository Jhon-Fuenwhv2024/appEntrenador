require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/env');
const authRoutes = require('./modules/auth/auth.routes');
const clientsRoutes = require('./modules/clients/clients.routes');
const routinesRoutes = require('./modules/routines/routines.routes');
const exercisesRoutes = require('./modules/exercises/exercises.routes');
const workoutSessionsRoutes = require('./modules/workout-sessions/workout-sessions.routes');
const templatesRoutes = require('./modules/templates/templates.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', clientsRoutes);
app.use('/api', routinesRoutes);
app.use('/api', exercisesRoutes);
app.use('/api', workoutSessionsRoutes);
app.use('/api', templatesRoutes);

app.listen(PORT, () => {
  console.log(`Servidor API modular (JWT) corriendo en http://localhost:${PORT}`);
});
