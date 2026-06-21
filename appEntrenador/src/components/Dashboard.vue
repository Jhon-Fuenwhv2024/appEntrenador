<template>
  <div class="dashboard-bg">
    
    <nav class="sidebar-pill">
      <v-avatar color="rgba(0, 229, 255, 0.1)" size="48" class="mb-8" style="border: 1px solid rgba(0, 229, 255, 0.3);">
        <v-icon icon="mdi-arm-flex" color="#00E5FF" size="28"></v-icon>
      </v-avatar>
      
      <v-icon icon="mdi-view-dashboard" size="24" class="nav-item active"></v-icon>
      <v-icon icon="mdi-format-list-checks" size="24" class="nav-item"></v-icon>
      <v-icon icon="mdi-chart-timeline-variant" size="24" class="nav-item"></v-icon>
      <v-icon icon="mdi-cog-outline" size="24" class="nav-item"></v-icon>

      <v-icon icon="mdi-logout-variant" size="24" class="nav-item nav-bottom mb-0" @click="handleLogout" title="Cerrar Sesión"></v-icon>
    </nav>

    <main class="flex-grow-1 pa-8" style="height: 100vh; overflow-y: auto;">
      
      <div class="mb-8 mt-2">
        <h1 class="text-h4 font-weight-bold mb-1" style="color: #ffffff;">Dashboard</h1>
        <p class="text-grey-lighten-1 text-subtitle-1">Bienvenido de vuelta, <span style="color: #00E5FF;">{{ userName }}</span></p>
      </div>

      <div v-if="userRole === 'trainer'">
        
        <v-row class="mb-6">
          <v-col cols="12" sm="4">
            <v-card class="pa-5 glass-card d-flex align-center justify-space-between" elevation="0" theme="dark">
              <div>
                <div class="text-caption text-grey text-uppercase mb-1">Total Alumnos</div>
                <div class="text-h5 font-weight-bold">{{ alumnos.length }}</div>
              </div>
              <v-icon icon="mdi-account-group" size="36" color="rgba(0, 229, 255, 0.5)"></v-icon>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card class="pa-5 glass-card d-flex align-center justify-space-between" elevation="0" theme="dark">
              <div>
                <div class="text-caption text-grey text-uppercase mb-1">Rutinas Activas</div>
                <div class="text-h5 font-weight-bold">0</div>
              </div>
              <v-icon icon="mdi-clipboard-text" size="36" color="rgba(0, 229, 255, 0.5)"></v-icon>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="7">
            <v-card class="pa-6 glass-card accent-card h-100 d-flex flex-column justify-center" theme="dark" elevation="0">
              <h3 class="text-h5 font-weight-bold mb-2">Crear nueva invitación</h3>
              <p class="text-body-2 text-grey-lighten-1 mb-6">
                Genera un token de acceso único para registrar de forma segura a tus nuevos clientes.
              </p>
              
              <div>
                <v-btn color="#00E5FF" class="text-black font-weight-bold rounded-lg px-6" size="large" @click="generarEnlace" :loading="cargandoLink">
                  <v-icon icon="mdi-link-variant" class="mr-2"></v-icon> Generar Link
                </v-btn>
              </div>

              <v-expand-transition>
                <div v-if="invitationLink" class="mt-6 pa-4 rounded-lg d-flex align-center justify-space-between" style="background-color: rgba(0,0,0,0.4); border: 1px solid rgba(0, 229, 255, 0.2);">
                  <div class="text-truncate mr-4 text-body-2" style="color: #00E5FF;">
                    {{ invitationLink }}
                  </div>
                  <v-btn icon="mdi-content-copy" size="small" variant="tonal" color="#00E5FF" @click="copiarLink"></v-btn>
                </div>
              </v-expand-transition>
            </v-card>
          </v-col>

          <v-col cols="12" md="5" class="d-flex flex-column gap-4" style="gap: 16px;">
            <v-card class="pa-5 glass-card flex-grow-1 d-flex align-center" theme="dark" elevation="0" style="cursor: pointer;">
              <v-avatar color="rgba(0, 229, 255, 0.1)" size="48" class="mr-4">
                <v-icon icon="mdi-weight-lifter" color="#00E5FF"></v-icon>
              </v-avatar>
              <div>
                <h4 class="text-subtitle-1 font-weight-bold mb-0">Asignar Rutinas</h4>
                <div class="text-caption text-grey">Gestionar planes de entrenamiento</div>
              </div>
              <v-spacer></v-spacer>
              <v-icon icon="mdi-chevron-right" color="grey"></v-icon>
            </v-card>

            <v-card class="pa-5 glass-card flex-grow-1 d-flex align-center" theme="dark" elevation="0" style="cursor: pointer;">
              <v-avatar color="rgba(0, 229, 255, 0.1)" size="48" class="mr-4">
                <v-icon icon="mdi-food-apple" color="#00E5FF"></v-icon>
              </v-avatar>
              <div>
                <h4 class="text-subtitle-1 font-weight-bold mb-0">Planes de Dieta</h4>
                <div class="text-caption text-grey">Configurar nutrición</div>
              </div>
              <v-spacer></v-spacer>
              <v-icon icon="mdi-chevron-right" color="grey"></v-icon>
            </v-card>
          </v-col>
        </v-row>

      </div>
    </main>

    <aside v-if="userRole === 'trainer'" class="right-panel pa-6 d-flex flex-column" style="width: 340px; flex-shrink: 0;">
      <div class="d-flex justify-space-between align-center mb-6 mt-2">
        <h3 class="text-subtitle-1 font-weight-bold text-white mb-0">Mis Alumnos</h3>
        <v-btn icon="mdi-dots-horizontal" variant="text" size="small" color="grey"></v-btn>
      </div>

      <v-text-field
        density="compact"
        variant="solo-filled"
        bg-color="rgba(255,255,255,0.05)"
        placeholder="Buscar alumno..."
        prepend-inner-icon="mdi-magnify"
        hide-details
        class="mb-6 rounded-lg"
        flat
      ></v-text-field>

      <v-progress-linear v-if="loadingAlumnos" indeterminate color="#00E5FF" class="mb-4"></v-progress-linear>

      <v-list bg-color="transparent" class="pa-0 flex-grow-1">
        <v-list-item v-for="alumno in alumnos" :key="alumno.id" class="client-item">
          <template v-slot:prepend>
            <v-badge dot color="#00E5FF" offset-x="3" offset-y="3">
              <v-avatar color="rgba(255, 255, 255, 0.05)" size="40">
                <span class="text-white font-weight-bold">{{ alumno.nombre.charAt(0).toUpperCase() }}</span>
              </v-avatar>
            </v-badge>
          </template>
          
          <v-list-item-title class="text-white font-weight-medium text-body-2 ml-2">{{ alumno.nombre }}</v-list-item-title>
          <v-list-item-subtitle class="text-grey text-caption ml-2">@{{ alumno.username }}</v-list-item-subtitle>
          
          <template v-slot:append>
            <v-btn icon="mdi-message-text-outline" variant="text" size="small" color="grey"></v-btn>
          </template>
        </v-list-item>
      </v-list>

      <div v-if="!loadingAlumnos && alumnos.length === 0" class="text-center mt-10">
        <p class="text-grey text-caption">No hay alumnos registrados.</p>
      </div>
    </aside>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const userName = ref('');
const userRole = ref('');
const invitationLink = ref('');
const cargandoLink = ref(false);
const alumnos = ref([]);
const loadingAlumnos = ref(true);

onMounted(() => {
  const storedRole = localStorage.getItem('userRole');
  const storedName = localStorage.getItem('userName');

  if (!storedRole) {
    router.push('/'); 
    return;
  }

  userRole.value = storedRole;
  userName.value = storedName;

  if (storedRole === 'trainer') {
    cargarAlumnos();
  }
});

const cargarAlumnos = async () => {
  try {
    loadingAlumnos.value = true;
    const response = await axios.get('http://localhost:3000/api/clients');
    if (response.data.success) {
      alumnos.value = response.data.clients;
    }
  } catch (error) {
    console.error('Error al cargar alumnos:', error);
  } finally {
    loadingAlumnos.value = false;
  }
};

const handleLogout = () => {
  localStorage.clear(); 
  router.push('/');     
};

const generarEnlace = async () => {
  try {
    cargandoLink.value = true;
    const response = await axios.post('http://localhost:3000/api/generate-token');
    if (response.data.success) {
      invitationLink.value = response.data.link_invitacion;
    }
  } catch (error) {
    alert('Hubo un error al generar el enlace.');
  } finally {
    cargandoLink.value = false;
  }
};

const copiarLink = () => {
  navigator.clipboard.writeText(invitationLink.value);
  alert('¡Enlace copiado!');
};
</script>

<style src="../assets/dashboard.css"></style>