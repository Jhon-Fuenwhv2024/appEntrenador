<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import AppLogo from '../../components/AppLogo.vue';
import { clearSession, getSessionUser } from '../auth/session.js';
import AppBottomNav from './AppBottomNav.vue';

const props = defineProps({
  role: {
    type: String,
    required: true,
    validator: (value) => ['trainer', 'client'].includes(value),
  },
  /** Active nav key: dashboard | clients | messages | library | settings | progress | profile | saas */
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

const isSuperAdmin = computed(() => getSessionUser()?.is_superadmin === true);

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
          title="Inicio"
          @click="go('/dashboard')"
        >
          <v-icon icon="mdi-view-dashboard-outline" size="24" />
        </button>
        <button
          type="button"
          class="nav-item"
          :class="{ active: active === 'clients' }"
          title="Alumnos"
          @click="go('/trainer/clients')"
        >
          <v-icon icon="mdi-account-group-outline" size="24" />
        </button>
        <button
          type="button"
          class="nav-item"
          :class="{ active: active === 'messages' }"
          title="Mensajes"
          @click="go('/trainer/messages')"
        >
          <v-icon icon="mdi-message-text-outline" size="24" />
        </button>
        <button
          type="button"
          class="nav-item"
          :class="{ active: active === 'library' }"
          title="Biblioteca"
          @click="go('/trainer/library')"
        >
          <v-icon icon="mdi-bookshelf" size="24" />
        </button>
        <button
          type="button"
          class="nav-item"
          :class="{ active: active === 'settings' }"
          title="Ajustes"
          @click="go('/trainer/settings')"
        >
          <v-icon icon="mdi-cog-outline" size="24" />
        </button>
        <button
          v-if="isSuperAdmin"
          type="button"
          class="nav-item"
          :class="{ active: active === 'saas' }"
          title="Panel SaaS"
          @click="go('/backoffice')"
        >
          <v-icon icon="mdi-shield-crown" size="24" />
        </button>
        <button
          v-if="isSuperAdmin"
          type="button"
          class="nav-item"
          :class="{ active: active === 'tagger' }"
          title="Etiquetar ejercicios"
          @click="go('/admin/exercises/tagger')"
        >
          <v-icon icon="mdi-tag-multiple-outline" size="24" />
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
        <button
          type="button"
          class="nav-item"
          :class="{ active: active === 'progress' }"
          title="Mi progreso"
          @click="go('/client/progress')"
        >
          <v-icon icon="mdi-chart-timeline-variant" size="24" />
        </button>
        <button
          type="button"
          class="nav-item"
          :class="{ active: active === 'messages' }"
          title="Mensajes"
          @click="go('/client/messages')"
        >
          <v-icon icon="mdi-message-text-outline" size="24" />
        </button>
        <button
          type="button"
          class="nav-item"
          :class="{ active: active === 'profile' }"
          title="Mi Perfil"
          @click="go('/client/profile')"
        >
          <v-icon icon="mdi-account-circle-outline" size="24" />
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
