import { createRouter, createWebHistory } from 'vue-router';
import LoginView from './features/auth/LoginView.vue';
import Dashboard from './components/Dashboard.vue';
import RegisterView from './features/auth/RegisterView.vue';
import ClientRoutinesView from './features/trainer/ClientRoutinesView.vue';
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
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/trainer/clients/:clientId',
    name: 'ClientRoutines',
    component: ClientRoutinesView,
    meta: { requiresAuth: true, role: 'trainer' },
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

  if (to.meta.role && user?.rol !== to.meta.role) {
    return { path: '/dashboard' };
  }

  return true;
});

export default router;
