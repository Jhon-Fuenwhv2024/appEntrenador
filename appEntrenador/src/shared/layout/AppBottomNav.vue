<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  role: {
    type: String,
    required: true,
    validator: (value) => ['trainer', 'client'].includes(value),
  },
  /** Override active key: dashboard | clients | messages | library | settings | progress | profile */
  active: {
    type: String,
    default: '',
  },
});

const route = useRoute();
const router = useRouter();

const trainerItems = [
  {
    key: 'dashboard',
    label: 'Inicio',
    icon: 'mdi-view-dashboard-outline',
    to: '/dashboard',
  },
  {
    key: 'clients',
    label: 'Alumnos',
    icon: 'mdi-account-group-outline',
    to: '/trainer/clients',
  },
  {
    key: 'messages',
    label: 'Chat',
    icon: 'mdi-message-text-outline',
    to: '/trainer/messages',
  },
  {
    key: 'library',
    label: 'Biblioteca',
    icon: 'mdi-bookshelf',
    to: '/trainer/library',
  },
  {
    key: 'settings',
    label: 'Ajustes',
    icon: 'mdi-cog-outline',
    to: '/trainer/settings',
  },
];

/** Client nav: Inicio + Progreso + Chat + Perfil */
const clientItems = [
  {
    key: 'dashboard',
    label: 'Inicio',
    icon: 'mdi-view-dashboard-outline',
    to: '/dashboard',
  },
  {
    key: 'progress',
    label: 'Progreso',
    icon: 'mdi-chart-timeline-variant',
    to: '/client/progress',
  },
  {
    key: 'messages',
    label: 'Chat',
    icon: 'mdi-message-text-outline',
    to: '/client/messages',
  },
  {
    key: 'profile',
    label: 'Perfil',
    icon: 'mdi-account-circle-outline',
    to: '/client/profile',
  },
];

const items = computed(() => (props.role === 'trainer' ? trainerItems : clientItems));

const resolvedActive = computed(() => {
  if (props.active) return props.active;

  const path = route.path;
  if (path.startsWith('/trainer/clients')) return 'clients';
  if (path.startsWith('/trainer/messages')) return 'messages';
  if (path.startsWith('/trainer/library') || path.startsWith('/trainer/exercises')) {
    return 'library';
  }
  if (path.startsWith('/trainer/settings')) return 'settings';
  if (path.startsWith('/client/progress')) return 'progress';
  if (path.startsWith('/client/messages')) return 'messages';
  if (path.startsWith('/client/profile')) return 'profile';
  if (path === '/dashboard' || path === '/') return 'dashboard';
  return '';
});

const go = (to) => {
  if (route.path === to) return;
  router.push(to);
};
</script>

<template>
  <!--
    Nav custom (no v-bottom-navigation): Trainfit no usa v-app/v-layout,
    y Vuetify exige layout inyectado para v-bottom-navigation.
    Estilo dark/cyan vía appShell.css (active = primary).
  -->
  <nav
    class="app-bottom-nav"
    :class="{ 'app-bottom-nav--client': role === 'client' }"
    aria-label="Navegación principal"
  >
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="app-bottom-nav__item"
      :class="{ active: resolvedActive === item.key }"
      :aria-current="resolvedActive === item.key ? 'page' : undefined"
      @click="go(item.to)"
    >
      <v-icon :icon="item.icon" size="22" />
      <span class="app-bottom-nav__label">{{ item.label }}</span>
    </button>
  </nav>
</template>
