import { createRouter, createWebHistory } from 'vue-router';
import Login from './components/Login.vue';
import Dashboard from './components/Dashboard.vue'
import Register from './components/Register.vue';

// Aquí definimos las páginas (rutas)
const routes = [
  { path: '/',
    component: 
    Login 
},
{
    path: '/registro',
    name: 'Registro',
    component: Register
},
{
  path: '/dashboard',
  name: 'Dashboard',
  component: Dashboard
},
  // Agregaremos más rutas aquí, por ejemplo: { path: '/panel', component: Panel }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;