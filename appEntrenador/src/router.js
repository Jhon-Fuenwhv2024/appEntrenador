import { createRouter, createWebHistory } from 'vue-router';
import LoginView from './features/auth/LoginView.vue';
import Dashboard from './components/Dashboard.vue';
import RegisterView from './features/auth/RegisterView.vue';
import ResetPasswordView from './features/auth/ResetPasswordView.vue';
import Client360View from './features/trainer/client-360/Client360View.vue';
import ExercisesCatalogView from './features/trainer/ExercisesCatalogView.vue';
import ClientsListView from './features/trainer/ClientsListView.vue';
import LibraryView from './features/trainer/LibraryView.vue';
import TrainerSettingsView from './features/trainer/TrainerSettingsView.vue';
import WorkoutPlayerView from './features/client/WorkoutPlayerView.vue';
import ClientRoutinePreviewView from './features/client/ClientRoutinePreviewView.vue';
import ClientProfileView from './features/client/ClientProfileView.vue';
import ClientProgressView from './features/client/ClientProgressView.vue';
import TrainerInboxView from './features/messaging/TrainerInboxView.vue';
import ClientChatView from './features/messaging/ClientChatView.vue';
import SuperAdminDashboardView from './features/saas/SuperAdminDashboardView.vue';
import ExerciseTaggerView from './features/admin/ExerciseTaggerView.vue';
import { getSessionUser, isAuthenticated } from './shared/auth/session.js';

const routes = [
  {
    path: '/',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/registro',
    name: 'Registro',
    component: RegisterView,
    meta: { guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPasswordView,
    meta: { guestOnly: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/client/progress',
    name: 'ClientProgress',
    component: ClientProgressView,
    meta: { requiresAuth: true, role: 'client' },
  },
  {
    path: '/client/messages',
    name: 'ClientMessages',
    component: ClientChatView,
    meta: { requiresAuth: true, role: 'client' },
  },
  {
    path: '/client/profile',
    name: 'ClientProfile',
    component: ClientProfileView,
    meta: { requiresAuth: true, role: 'client' },
  },
  {
    path: '/client/workout/:routineId',
    name: 'WorkoutPlayer',
    component: WorkoutPlayerView,
    meta: { requiresAuth: true, role: 'client' },
  },
  {
    path: '/client/routine/:routineId',
    name: 'ClientRoutinePreview',
    component: ClientRoutinePreviewView,
    meta: { requiresAuth: true, role: 'client' },
  },
  {
    path: '/trainer/clients',
    name: 'TrainerClients',
    component: ClientsListView,
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/clients/:clientId',
    name: 'ClientRoutines',
    component: Client360View,
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/messages',
    name: 'TrainerMessages',
    component: TrainerInboxView,
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/library',
    name: 'TrainerLibrary',
    component: LibraryView,
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/library/exercises',
    name: 'TrainerLibraryExercises',
    component: LibraryView,
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/settings',
    name: 'TrainerSettings',
    component: TrainerSettingsView,
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/exercises',
    name: 'ExercisesCatalog',
    component: ExercisesCatalogView,
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/backoffice',
    name: 'SuperAdminBackoffice',
    component: SuperAdminDashboardView,
    meta: { requiresAuth: true, requiresSuperAdmin: true },
  },
  {
    path: '/admin/exercises/tagger',
    name: 'ExerciseTagger',
    component: ExerciseTaggerView,
    meta: { requiresAuth: true, requiresSuperAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authenticated = isAuthenticated();
  const user = getSessionUser();

  if (to.meta.requiresAuth && !authenticated) {
    return { path: '/' };
  }

  if (to.meta.guestOnly && authenticated && to.path === '/') {
    return { path: '/dashboard' };
  }

  if (to.meta.requiresSuperAdmin && user?.is_superadmin !== true) {
    return { path: '/dashboard' };
  }

  if (to.meta.role && user?.rol !== to.meta.role) {
    return { path: '/dashboard' };
  }

  return true;
});

export default router;
