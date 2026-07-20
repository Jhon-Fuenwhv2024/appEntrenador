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
const nutritionRoutes = require('./modules/nutrition/nutrition.routes');
const habitsRoutes = require('./modules/habits/habits.routes');
const checkinsRoutes = require('./modules/checkins/checkins.routes');
const messagesRoutes = require('./modules/messages/messages.routes');
const saasRoutes = require('./modules/saas/saas.routes');
const membershipsRoutes = require('./modules/memberships/memberships.routes');
const personalRecordsRoutes = require('./modules/personal-records/personal-records.routes');
const consistencyRoutes = require('./modules/consistency/consistency.routes');
const dietPlansRoutes = require('./modules/diet-plans/diet-plans.routes');
const adminExercisesRoutes = require('./modules/admin-exercises/admin-exercises.routes');
const { ensureAvatarsDir } = require('./middleware/uploadAvatar');
const { ensurePhotosDir } = require('./middleware/uploadProgressPhotos');
const { ensureNotificationsTable } = require('./db/ensureNotificationsTable');
const { ensureHabitsTables } = require('./db/ensureHabitsTables');
const { ensureCheckinsTables } = require('./db/ensureCheckinsTables');
const { ensureMessagesTable } = require('./db/ensureMessagesTable');
const { ensureClientMembershipsTable } = require('./db/ensureClientMembershipsTable');
const { ensurePersonalRecordsTable } = require('./db/ensurePersonalRecordsTable');
const { ensureClientStreaksTable } = require('./db/ensureClientStreaksTable');
const { ensureDietPlansTables } = require('./db/ensureDietPlansTables');
const { ensureSaasColumns } = require('./db/ensureSaasColumns');
const { ensureUsuariosEmailResetColumns } = require('./db/ensureUsuariosEmailResetColumns');
const {
  ensureExercisesI18nColumns,
  ensureExercisesMediaDir,
} = require('./db/ensureExercisesI18nColumns');
const { ensureExercisesMuscleTags } = require('./db/ensureExercisesMuscleTags');

const app = express();

ensureAvatarsDir();
ensurePhotosDir();
ensureExercisesMediaDir();

app.use(cors());
app.use(express.json());
// Media local de ejercicios (y otros uploads): /uploads/... → backend/public/uploads
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
app.use('/api', nutritionRoutes);
app.use('/api', habitsRoutes);
app.use('/api', checkinsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/saas', saasRoutes);
app.use('/api', membershipsRoutes);
app.use('/api', personalRecordsRoutes);
app.use('/api', consistencyRoutes);
app.use('/api', dietPlansRoutes);
app.use('/api/admin', adminExercisesRoutes);

async function start() {
  try {
    await ensureSaasColumns();
  } catch (error) {
    console.error('No se pudieron asegurar las columnas SaaS:', error.message);
  }

  try {
    await ensureUsuariosEmailResetColumns();
  } catch (error) {
    console.error('No se pudieron asegurar columnas email/reset de usuarios:', error.message);
  }

  try {
    await ensureNotificationsTable();
  } catch (error) {
    console.error('No se pudo asegurar la tabla notifications:', error.message);
  }

  try {
    await ensureHabitsTables();
  } catch (error) {
    console.error('No se pudo asegurar las tablas de hábitos:', error.message);
  }

  try {
    await ensureCheckinsTables();
  } catch (error) {
    console.error('No se pudo asegurar las tablas de check-ins:', error.message);
  }

  try {
    await ensureMessagesTable();
  } catch (error) {
    console.error('No se pudo asegurar la tabla messages:', error.message);
  }

  try {
    await ensureClientMembershipsTable();
  } catch (error) {
    console.error('No se pudo asegurar la tabla client_memberships:', error.message);
  }

  try {
    await ensurePersonalRecordsTable();
  } catch (error) {
    console.error('No se pudo asegurar la tabla personal_records:', error.message);
  }

  try {
    await ensureClientStreaksTable();
  } catch (error) {
    console.error('No se pudo asegurar la tabla client_streaks:', error.message);
  }

  try {
    await ensureDietPlansTables();
  } catch (error) {
    console.error('No se pudo asegurar las tablas de planes de dieta:', error.message);
  }

  try {
    await ensureExercisesI18nColumns();
  } catch (error) {
    console.error('No se pudieron asegurar columnas i18n de exercises:', error.message);
  }

  try {
    await ensureExercisesMuscleTags();
  } catch (error) {
    console.error('No se pudieron asegurar columnas muscle tags de exercises:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Servidor API modular (JWT) corriendo en http://localhost:${PORT}`);
  });
}

start();