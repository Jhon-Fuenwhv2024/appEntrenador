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
  <AppShell role="trainer" active="settings">
    <main class="main-content flex-grow-1 overflow-y-auto">
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="header-title">Ajustes</h1>
          <p class="header-greeting text-medium-emphasis">
            Preferencias de tu cuenta de entrenador
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
        <v-alert type="info" variant="tonal" density="comfortable">
          La pantalla de ajustes estará disponible próximamente. El cierre de sesión
          sigue disponible en el header (móvil) y en el pie del sidebar (desktop).
        </v-alert>
      </div>
    </main>
  </AppShell>
</template>
