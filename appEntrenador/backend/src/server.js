require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/env');
const authRoutes = require('./modules/auth/auth.routes');
const invitesRoutes = require('./modules/invites/invites.routes');
const clientsRoutes = require('./modules/clients/clients.routes');
const routinesRoutes = require('./modules/routines/routines.routes');
const exercisesRoutes = require('./modules/exercises/exercises.routes');
const workoutSessionsRoutes = require('./modules/workout-sessions/workout-sessions.routes');
const templatesRoutes = require('./modules/templates/templates.routes');
const profileRoutes = require('./modules/profile/profile.routes');
const accountRoutes = require('./modules/account/account.routes');
const bodyCompositionRoutes = require('./modules/body-composition/body-composition.routes');
const progressRoutes = require('./modules/progress/progress.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const { ensureAvatarsDir } = require('./middleware/uploadAvatar');
const { ensureNotificationsTable } = require('./db/ensureNotificationsTable');

const app = express();

ensureAvatarsDir();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/api', authRoutes);
app.use('/api/invites', invitesRoutes);
app.use('/api', clientsRoutes);
app.use('/api', routinesRoutes);
app.use('/api', exercisesRoutes);
app.use('/api', workoutSessionsRoutes);
app.use('/api', templatesRoutes);
app.use('/api', profileRoutes);
app.use('/api', accountRoutes);
app.use('/api', bodyCompositionRoutes);
app.use('/api', progressRoutes);
app.use('/api/notifications', notificationsRoutes);

async function start() {
  try {
    await ensureNotificationsTable();
  } catch (error) {
    console.error('No se pudo asegurar la tabla notifications:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Servidor API modular (JWT) corriendo en http://localhost:${PORT}`);
  });
}

start();