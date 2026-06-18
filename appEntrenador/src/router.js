import { createRouter, createWebHistory } from 'vue-router';
import Login from './components/Login.vue';

// Aquí definimos las páginas (rutas)
const routes = [
  { path: '/',
    component: 
    Login 
},
  // Agregaremos más rutas aquí, por ejemplo: { path: '/panel', component: Panel }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;