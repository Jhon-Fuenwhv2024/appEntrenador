<template>
  <div class="dashboard-bg">
    
    <nav class="sidebar-pill">
      <v-avatar color="rgba(0, 229, 255, 0.05)" size="48" class="mb-8 logo-avatar">
        <v-icon icon="mdi-dumbbell" color="#00E5FF" size="24"></v-icon>
      </v-avatar>
      
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

    <main class="main-content flex-grow-1 pa-8">
      
      <div class="d-flex justify-space-between align-start mb-8 mt-2">
        <div>
          <div class="text-caption text-grey-lighten-1 mb-1 d-flex align-center">
            <v-icon icon="mdi-calendar-blank-outline" size="16" class="mr-2"></v-icon>
            {{ fechaActual }}
          </div>
          <h1 class="text-h4 font-weight-bold mb-1 text-white">Dashboard Cliente</h1>
          <p class="text-grey-lighten-1 text-subtitle-2 font-weight-regular">
            Bienvenido, <span style="color: #00E5FF;">{{ userName }}</span>
          </p>
        </div>

        <div class="d-flex align-center">
          <v-badge content="0" color="#00E5FF" text-color="black" offset-x="5" offset-y="5">
            <v-btn icon="mdi-bell-outline" variant="outlined" color="grey-darken-2" class="mr-4 rounded-circle bg-card" size="small"></v-btn>
          </v-badge>
          
          <div class="profile-pill d-flex align-center bg-card px-2 py-1 rounded-pill border-subtle">
            <v-avatar color="#00E5FF" size="32" class="mr-3">
              <span class="text-black font-weight-bold text-caption">{{ obtenerInicial(userName) }}</span>
            </v-avatar>
            <div class="mr-3">
              <div class="text-white text-caption font-weight-bold lh-1">{{ userName }}</div>
              <div class="text-grey text-caption lh-1 mt-1" style="font-size: 10px !important;">Cliente</div>
            </div>
          </div>
        </div>
      </div>

      <v-row>
        <v-col cols="12">
          <v-card class="pa-6 bg-card border-subtle rounded-xl text-center" elevation="0">
            <v-icon icon="mdi-rocket-launch-outline" size="48" color="grey" class="mb-4"></v-icon>
            <h3 class="text-h5 text-white mb-2">¡Pronto verás tu progreso aquí!</h3>
            <p class="text-grey">Tu entrenador está preparando tus planes de entrenamiento y dieta.</p>
          </v-card>
        </v-col>
      </v-row>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const userName = ref('');
const userRole = ref('');

const fechaActual = computed(() => {
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  let fecha = new Date().toLocaleDateString('es-ES', opciones);
  return fecha.charAt(0).toUpperCase() + fecha.slice(1);
});

const obtenerInicial = (nombre) => nombre ? nombre.substring(0, 2).toUpperCase() : '??';

onMounted(() => {
  const storedRole = localStorage.getItem('userRole');
  const storedName = localStorage.getItem('userName');

  if (!storedRole) {
    router.push('/'); 
    return;
  }

  userRole.value = storedRole;
  userName.value = storedName;
});

const handleLogout = () => {
  localStorage.clear(); 
  router.push('/');     
};
</script>

<style src="../assets/trainerDashboard.css" scoped></style>
