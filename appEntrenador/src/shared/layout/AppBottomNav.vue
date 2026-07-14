<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  role: {
    type: String,
    required: true,
    validator: (value) => ['trainer', 'client'].includes(value),
  },
  /** Override active key: dashboard | exercises | routines | home */
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
    key: 'exercises',
    label: 'Ejercicios',
    icon: 'mdi-dumbbell',
    to: '/trainer/exercises',
  },
];

const clientItems = [
  {
    key: 'dashboard',
    label: 'Inicio',
    icon: 'mdi-view-dashboard-outline',
    to: '/dashboard',
  },
];

const items = computed(() => (props.role === 'trainer' ? trainerItems : clientItems));

const resolvedActive = computed(() => {
  if (props.active) return props.active;

  const path = route.path;
  if (path.startsWith('/trainer/exercises')) return 'exercises';
  if (path.startsWith('/trainer/clients')) return 'routines';
  if (path === '/dashboard' || path === '/') return 'dashboard';
  return '';
});

const go = (to) => {
  if (route.path === to) return;
  router.push(to);
};
</script>

<template>
  <nav class="app-bottom-nav" aria-label="Navegación principal">
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
