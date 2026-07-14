<script setup>
import { useRouter } from 'vue-router';
import AppLogo from '../../components/AppLogo.vue';
import { clearSession } from '../auth/session.js';
import AppBottomNav from './AppBottomNav.vue';

const props = defineProps({
  role: {
    type: String,
    required: true,
    validator: (value) => ['trainer', 'client'].includes(value),
  },
  /** Active nav key for sidebar + bottom nav */
  active: {
    type: String,
    default: 'dashboard',
  },
  /** Adds class for trainer dashboard mobile stack (alumnos arriba) */
  withAside: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();

const handleLogout = () => {
  clearSession();
  router.push('/');
};

const go = (path) => {
  if (router.currentRoute.value.path === path) return;
  router.push(path);
};
</script>

<template>
  <div
    class="dashboard-bg"
    :class="{ 'dashboard-bg--with-aside': props.withAside }"
  >
    <nav class="sidebar-pill" aria-label="Navegación lateral">
      <div class="logo-wrap">
        <AppLogo size="md" />
      </div>

      <template v-if="role === 'trainer'">
        <button
          type="button"
          class="nav-item"
          :class="{ active: active === 'dashboard' }"
          title="Dashboard"
          @click="go('/dashboard')"
        >
          <v-icon icon="mdi-view-dashboard-outline" size="24" />
        </button>
        <button
          type="button"
          class="nav-item"
          :class="{ active: active === 'exercises' }"
          title="Catálogo de ejercicios"
          @click="go('/trainer/exercises')"
        >
          <v-icon icon="mdi-dumbbell" size="24" />
        </button>
        <button
          v-if="active === 'routines'"
          type="button"
          class="nav-item active"
          title="Rutinas del alumno"
        >
          <v-icon icon="mdi-clipboard-text-outline" size="24" />
        </button>
      </template>

      <template v-else>
        <button
          type="button"
          class="nav-item"
          :class="{ active: active === 'dashboard' }"
          title="Inicio"
          @click="go('/dashboard')"
        >
          <v-icon icon="mdi-view-dashboard-outline" size="24" />
        </button>
      </template>

      <button
        type="button"
        class="nav-item nav-bottom mb-0"
        title="Cerrar Sesión"
        @click="handleLogout"
      >
        <v-icon icon="mdi-logout-variant" size="24" />
      </button>
    </nav>

    <div class="shell-body">
      <slot />
    </div>

    <slot name="aside" />

    <AppBottomNav :role="role" :active="active" />
  </div>
</template>

<style src="../../assets/appShell.css"></style>
