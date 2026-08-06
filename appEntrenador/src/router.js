import { nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
// Optimización: Login eager para first paint; resto lazy (Feature 089 / ADR-0012).
import LoginView from './features/auth/LoginView.vue';
import { getSessionUser, isAuthenticated } from './shared/auth/session.js';
import { scrollAppToTop } from './shared/navigation/scrollToTop.js';

/** Evita que el navegador restaure el scroll al volver a una ruta. */
if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const routes = [
  {
    path: '/',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/registro',
    name: 'Registro',
    component: () => import('./features/auth/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('./features/auth/ResetPasswordView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('./components/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/client/progress',
    name: 'ClientProgress',
    component: () => import('./features/client/ClientProgressView.vue'),
    meta: { requiresAuth: true, role: 'client' },
  },
  {
    path: '/client/messages',
    name: 'ClientMessages',
    component: () => import('./features/messaging/ClientChatView.vue'),
    meta: { requiresAuth: true, role: 'client' },
  },
  {
    path: '/client/profile',
    name: 'ClientProfile',
    component: () => import('./features/client/ClientProfileView.vue'),
    meta: { requiresAuth: true, role: 'client' },
  },
  {
    path: '/client/workout/:routineId',
    name: 'WorkoutPlayer',
    component: () => import('./features/client/WorkoutPlayerView.vue'),
    meta: { requiresAuth: true, role: 'client' },
  },
  {
    path: '/client/routine/:routineId',
    name: 'ClientRoutinePreview',
    component: () => import('./features/client/ClientRoutinePreviewView.vue'),
    meta: { requiresAuth: true, role: 'client' },
  },
  {
    path: '/client/shopping-list',
    name: 'ClientShoppingList',
    component: () => import('./features/client/ClientShoppingListView.vue'),
    meta: { requiresAuth: true, role: 'client' },
  },
  {
    path: '/trainer/clients',
    name: 'TrainerClients',
    component: () => import('./features/trainer/ClientsListView.vue'),
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/clients/:clientId',
    name: 'ClientRoutines',
    component: () => import('./features/trainer/client-360/Client360View.vue'),
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/messages',
    name: 'TrainerMessages',
    component: () => import('./features/messaging/TrainerInboxView.vue'),
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/library',
    name: 'TrainerLibrary',
    component: () => import('./features/trainer/LibraryView.vue'),
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/library/exercises',
    name: 'TrainerLibraryExercises',
    component: () => import('./features/trainer/LibraryView.vue'),
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/library/memberships',
    name: 'TrainerLibraryMemberships',
    component: () => import('./features/trainer/LibraryView.vue'),
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/library/diets',
    name: 'TrainerLibraryDiets',
    component: () => import('./features/trainer/LibraryView.vue'),
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/settings',
    name: 'TrainerSettings',
    component: () => import('./features/trainer/TrainerSettingsView.vue'),
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/trainer/exercises',
    name: 'ExercisesCatalog',
    component: () => import('./features/trainer/ExercisesCatalogView.vue'),
    meta: { requiresAuth: true, role: 'trainer' },
  },
  {
    path: '/backoffice',
    name: 'SuperAdminBackoffice',
    component: () => import('./features/saas/SuperAdminDashboardView.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true },
  },
  {
    path: '/admin/exercises/tagger',
    name: 'ExerciseTagger',
    component: () => import('./features/admin/ExerciseTaggerView.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, top: 0 };
    }
    return { top: 0, left: 0 };
  },
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

/** Tras montar la vista: window + `.main-content` (scroll real del shell). */
router.afterEach(() => {
  nextTick(() => {
    scrollAppToTop();
    requestAnimationFrame(() => {
      scrollAppToTop();
    });
  });
});

export default router;
