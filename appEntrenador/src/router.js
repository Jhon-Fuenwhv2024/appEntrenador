import { createRouter, createWebHistory } from 'vue-router';
import LoginView from './features/auth/LoginView.vue';
import Dashboard from './components/Dashboard.vue';
import RegisterView from './features/auth/RegisterView.vue';

const routes = [
  {
    path: '/',
    component: LoginView,
  },
  {
    path: '/registro',
    name: 'Registro',
    component: RegisterView,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;