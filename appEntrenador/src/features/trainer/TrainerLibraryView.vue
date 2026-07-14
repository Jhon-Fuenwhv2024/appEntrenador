<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { clearSession, getSessionUser } from '../../shared/auth/session.js';
import AppShell from '../../shared/layout/AppShell.vue';

const router = useRouter();

const handleLogout = () => {
  clearSession();
  router.push('/');
};

onMounted(() => {
  const user = getSessionUser();
  if (!user || user.rol !== 'trainer') {
    router.push('/dashboard');
  }
});
</script>

<template>
  <AppShell role="trainer" active="library">
    <main class="main-content flex-grow-1 overflow-y-auto">
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="header-title">Biblioteca</h1>
          <p class="header-greeting text-medium-emphasis">
            Plantillas y herramientas del entrenador
          </p>
        </div>

        <div class="header-right">
          <button
            type="button"
            class="header-logout-btn"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            @click="handleLogout"
          >
            <v-icon icon="mdi-logout-variant" size="20" />
          </button>
        </div>
      </header>

      <div class="pa-4 pa-md-6">
        <v-alert type="info" variant="tonal" class="mb-6" density="comfortable">
          La biblioteca completa (plantillas y catálogo embebido) llegará en próximas features.
          Mientras tanto puedes abrir el catálogo de ejercicios.
        </v-alert>

        <v-btn
          color="primary"
          prepend-icon="mdi-dumbbell"
          @click="router.push('/trainer/exercises')"
        >
          Abrir catálogo de ejercicios
        </v-btn>
      </div>
    </main>
  </AppShell>
</template>
