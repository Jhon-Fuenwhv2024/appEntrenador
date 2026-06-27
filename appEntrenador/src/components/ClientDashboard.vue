<template>
  <div class="dashboard-bg">
    <nav class="sidebar-pill">
      <div class="logo-wrap">
        <AppLogo size="md" />
      </div>

      <div class="nav-item active">
        <v-icon icon="mdi-view-dashboard-outline" size="24"></v-icon>
      </div>
      <div class="nav-item">
        <v-icon icon="mdi-calendar-check" size="24"></v-icon>
      </div>
      <div class="nav-item">
        <v-icon icon="mdi-food-apple" size="24"></v-icon>
      </div>
      <div class="nav-item">
        <v-icon icon="mdi-cog-outline" size="24"></v-icon>
      </div>

      <div class="nav-item nav-bottom mb-0" @click="handleLogout" title="Cerrar Sesión">
        <v-icon icon="mdi-logout-variant" size="24"></v-icon>
      </div>
    </nav>

    <main class="main-content flex-grow-1">
      <header class="dashboard-header">
        <div class="header-left">
          <div class="header-date">
            <v-icon icon="mdi-calendar-blank-outline" size="14"></v-icon>
            {{ fechaActual }}
          </div>
          <h1 class="header-title">{{ APP_NAME }}</h1>
          <p class="header-greeting">
            Bienvenido, <span class="text-cyan">{{ userName }}</span>
          </p>
        </div>

        <div class="header-right">
          <v-badge content="0" color="#00E5FF" text-color="#0B0D12" offset-x="4" offset-y="4">
            <button type="button" class="notification-btn" aria-label="Notificaciones">
              <v-icon icon="mdi-bell-outline" size="20" color="#8B929E"></v-icon>
            </button>
          </v-badge>

          <div class="profile-pill">
            <div class="profile-avatar">{{ obtenerIniciales(userName) }}</div>
            <div class="profile-info">
              <div class="profile-name">{{ userName }}</div>
              <div class="profile-role">Cliente</div>
            </div>
          </div>
        </div>
      </header>

      <div class="client-empty-card">
        <v-icon icon="mdi-rocket-launch-outline" size="28" color="#8B929E" class="client-empty-icon"></v-icon>
        <h2 class="client-empty-title">¡Pronto verás tu progreso aquí!</h2>
        <p class="client-empty-desc">Tu entrenador está preparando tus planes de entrenamiento y dieta.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { APP_NAME } from '../config/app.js';
import AppLogo from './AppLogo.vue';

const router = useRouter();
const userName = ref('');

const fechaActual = computed(() => {
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fecha = new Date().toLocaleDateString('es-ES', opciones);
  return fecha
    .split(', ')
    .map((part, index) => {
      if (index === 0) return part.charAt(0).toUpperCase() + part.slice(1);
      return part.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    })
    .join(', ');
});

const obtenerIniciales = (nombre) => {
  if (!nombre) return '??';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return nombre.substring(0, 2).toUpperCase();
};

onMounted(() => {
  const storedRole = localStorage.getItem('userRole');
  const storedName = localStorage.getItem('userName');

  if (!storedRole) {
    router.push('/');
    return;
  }

  userName.value = storedName;
});

const handleLogout = () => {
  localStorage.clear();
  router.push('/');
};
</script>

<style src="../assets/trainerDashboard.css" scoped></style>
